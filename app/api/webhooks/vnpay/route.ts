// app/api/webhooks/vnpay/route.ts
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { verifyVnpaySignature } from "@/lib/payments/vnpay";
import { prisma } from "@/lib/prisma";
import { cancelOrderAndRestoreStock } from "@/lib/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

// VNPay gọi IPN bằng GET, response PHẢI đúng format {RspCode, Message} theo spec của họ,
// không phải format tự do như Stripe — sai format thì VNPay coi là lỗi và sẽ gọi lại (retry).
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  if (!verifyVnpaySignature(searchParams)) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });
  }

  const paymentId = searchParams.get("vnp_TxnRef");
  const responseCode = searchParams.get("vnp_ResponseCode"); // "00" = thành công
  const amount = searchParams.get("vnp_Amount");

  if (!paymentId) {
    return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  }

  // Đối soát số tiền — chống trường hợp (dù hiếm) chữ ký hợp lệ nhưng amount bị can thiệp
  // ở tầng khác trước khi tới đây. Số tiền VNPay trả về là ×100 giống lúc gửi đi.
  const expectedAmount = Math.round(Number(payment.amount)) * 100;
  if (amount !== String(expectedAmount)) {
    return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
  }

  // Idempotent — VNPay có thể gọi IPN nhiều lần cho cùng giao dịch
  if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
    return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
  }

  const rawPayload = Object.fromEntries(searchParams.entries());

  if (responseCode === "00") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "SUCCEEDED", rawPayload },
      }),
      prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } }),
    ]);

    // Gửi email NGOÀI transaction — I/O ra ngoài không cần rollback DB nếu lỗi (hàm đã tự catch).
    const fullOrder = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true, user: true },
    });
    const to = fullOrder?.guestEmail ?? fullOrder?.user?.email;
    if (fullOrder && to) {
      await sendOrderConfirmationEmail({ to, order: fullOrder });
    }
  } else {
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED", rawPayload } });
    await cancelOrderAndRestoreStock(payment.orderId);
  }

  return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
}