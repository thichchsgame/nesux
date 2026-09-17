// lib/payments/vnpay.ts
import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Order, OrderItem } from "@/app/generated/prisma/client";

const VNP_URL = process.env.VNPAY_URL!;
const TMN_CODE = process.env.VNPAY_TMN_CODE!;
const HASH_SECRET = process.env.VNPAY_HASH_SECRET!;
const RETURN_URL = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/vnpay-return`;

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// VNPay yêu cầu: sort key theo alphabet TRƯỚC khi build chuỗi ký — sai thứ tự là sai chữ ký,
// dù giá trị đúng 100%. Đây là lỗi phổ biến nhất khi tích hợp VNPay.
function sortedQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`)
    .join("&");
}

function signParams(params: Record<string, string>): string {
  const signData = sortedQueryString(params);
  return crypto.createHmac("sha512", HASH_SECRET).update(Buffer.from(signData, "utf-8")).digest("hex");
}

export async function createVnpayPaymentUrl(
  order: Order & { items: OrderItem[] },
  clientIp: string
) {
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "VNPAY",
      status: "PENDING",
      amount: order.totalAmount,
      currency: "VND",
      idempotencyKey: crypto.randomUUID(),
    },
  });

  const now = new Date();
  // vnp_TxnRef PHẢI unique cho mỗi lần gọi tạo URL (không phải mỗi Order) — dùng payment.id
  // để hỗ trợ đúng nghiệp vụ "nhiều lần thử thanh toán trên 1 Order" đã thiết kế từ Bước 2/5.
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: TMN_CODE,
    // VNPay quy định amount = số tiền thật × 100 (không có phần thập phân)
    vnp_Amount: String(Math.round(Number(order.totalAmount)) * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: payment.id,
    vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`, // VNPay sandbox không chấp nhận tiếng Việt có dấu ở field này
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: RETURN_URL,
    vnp_IpAddr: clientIp,
    vnp_CreateDate: formatDate(now),
  };

  const secureHash = signParams(params);
  const query = sortedQueryString(params);

  await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: payment.id } });

  return `${VNP_URL}?${query}&vnp_SecureHash=${secureHash}`;
}

// Dùng chung cho cả IPN và Return URL — verify lại chữ ký từ query params VNPay gửi về
export function verifyVnpaySignature(searchParams: URLSearchParams): boolean {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
      params[key] = value;
    }
  });

  const receivedHash = searchParams.get("vnp_SecureHash");
  if (!receivedHash) return false;

  const expectedHash = signParams(params);
  // So sánh timing-safe để chống timing attack dò chữ ký — cùng nguyên tắc verify webhook
  // đã áp dụng bên Stripe, dù Stripe SDK tự lo việc này còn ở đây phải tự làm.
  const a = Buffer.from(receivedHash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}