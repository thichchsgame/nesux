// lib/payments/stripe.ts
import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { Order, OrderItem } from "@/app/generated/prisma/client";

// LƯU Ý: kiểm tra `npm ls stripe` để lấy đúng chuỗi apiVersion khớp bản SDK đã cài,
// nếu TypeScript báo lỗi type ở field apiVersion thì điền lại giá trị đúng ở đây.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function createStripeCheckoutSession(order: Order & { items: OrderItem[] }) {
  // Payment record tạo TRƯỚC khi gọi Stripe — orderId + provider + amount là sự thật nghiệp vụ,
  // idempotencyKey random để cho phép nhiều lần thử thanh toán trên cùng 1 Order (đúng comment
  // gốc trong schema.prisma: "tách riêng khỏi Order để hỗ trợ nhiều lần thử thanh toán").
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "STRIPE",
      status: "PENDING",
      amount: order.totalAmount,
      currency: "VND",
      idempotencyKey: crypto.randomUUID(),
    },
  });

  // VND là zero-decimal currency với Stripe (giống JPY/KRW) — unit_amount là số nguyên VND,
  // KHÔNG nhân 100 như USD. Dùng 1 line item tổng thay vì tách từng sản phẩm + ship + giảm giá,
  // vì Stripe Checkout không hỗ trợ line item âm (discount) một cách tự nhiên qua price_data.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "vnd",
          unit_amount: Number(order.totalAmount),
          product_data: { name: `Đơn hàng ${order.orderNumber}` },
        },
        quantity: 1,
      },
    ],
    // metadata là nguồn tin cậy để webhook tra ngược Payment/Order — không dựa vào providerRef
    // vì providerRef (session.id) chỉ có SAU khi tạo session này, còn metadata gửi kèm ngay từ đầu.
    metadata: { orderId: order.id, paymentId: payment.id, orderNumber: order.orderNumber },
    success_url: `${APP_URL}/checkout/success?order=${order.orderNumber}`,
    cancel_url: `${APP_URL}/checkout/cancelled?order=${order.orderNumber}`,
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: session.id } });

  if (!session.url) throw new Error("Không tạo được phiên thanh toán Stripe.");
  return session.url;
}