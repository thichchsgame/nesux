import "server-only";
import { Resend } from "resend";
import type { Order, OrderItem } from "@/app/generated/prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY!);
const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export async function sendOrderConfirmationEmail(params: {
  to: string;
  order: Order & { items: OrderItem[] };
}) {
  const { to, order } = params;

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;">${i.productNameSnapshot} ${[i.sizeSnapshot, i.colorSnapshot].filter(Boolean).join(" / ")} × ${i.quantity}</td><td style="text-align:right;">${fmt.format(Number(i.lineTotal))}</td></tr>`,
    )
    .join("");

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Nexus <onboarding@resend.dev>",
      to,
      subject: `Xác nhận đơn hàng ${order.orderNumber} — Nexus`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>Cảm ơn bạn đã đặt hàng!</h2>
          <p>Mã đơn hàng: <strong>${order.orderNumber}</strong></p>
          <table style="width:100%; border-collapse: collapse;">${itemsHtml}</table>
          <p style="margin-top:16px; font-weight:bold;">Tổng cộng: ${fmt.format(Number(order.totalAmount))}</p>
          <p style="color:#666; font-size:13px; margin-top:24px;">
            Giao tới: ${order.shippingFullName}, ${order.shippingLine1}, ${order.shippingWard ?? ""} ${order.shippingCity}
          </p>
        </div>
      `,
    });
  } catch (e) {
    // Gửi email thất bại KHÔNG được làm hỏng luồng xác nhận thanh toán — chỉ log lại để theo dõi,
    // không throw, không chặn webhook trả 200 về Stripe/VNPay.
    console.error("Gửi email xác nhận đơn hàng thất bại:", e);
  }
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Nexus <onboarding@resend.dev>",
      to,
      subject: "Đặt lại mật khẩu — Nexus",
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;"><h2>Yêu cầu đặt lại mật khẩu</h2><p>Bấm vào nút bên dưới để đặt mật khẩu mới. Link có hiệu lực trong 1 giờ.</p><p style="margin:24px 0;"><a href="${resetUrl}" style="background:#0b0b0c;color:#ededed;padding:12px 24px;text-decoration:none;display:inline-block;">Đặt lại mật khẩu</a></p><p style="color:#666;font-size:13px;">Nếu bạn không yêu cầu việc này, có thể bỏ qua email.</p></div>`,
    });
  } catch (error) {
    console.error("Gửi email đặt lại mật khẩu thất bại:", error);
    throw error;
  }
}
