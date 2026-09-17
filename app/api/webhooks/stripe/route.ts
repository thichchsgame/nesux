// app/api/webhooks/stripe/route.ts
import "server-only";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";
import { cancelOrderAndRestoreStock } from "@/lib/orders";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Route Handler (Node runtime, KHÔNG phải Edge) — khác proxy.ts, nên dùng Prisma Client/bcrypt
// thoải mái ở đây. Cần raw body để verify chữ ký nên đọc qua request.text(), không parse JSON tay.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Thiếu chữ ký." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    // KHÔNG tin payload nếu verify thất bại — đúng rule "không tin dữ liệu callback thô từ client"
    return NextResponse.json({ error: "Chữ ký không hợp lệ." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (!paymentId) break;

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) break;

      // Idempotent: Stripe có thể gửi trùng cùng 1 event nhiều lần (retry theo chuẩn webhook).
      // Nếu Payment đã SUCCEEDED rồi thì bỏ qua, không cộng dồn/update lại — chống xử lý trùng.
      if (payment.status === "SUCCEEDED") break;

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "SUCCEEDED",
            providerRef: (session.payment_intent as string) ?? session.id,
            rawPayload: event as unknown as object,
          },
        }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } }),
      ]);

      // Gửi email NGOÀI transaction — I/O ra ngoài, lỗi gửi email không cần rollback DB
      // (hàm sendOrderConfirmationEmail đã tự bắt lỗi bên trong, không throw ra ngoài).
      const fullOrder = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true, user: true },
      });
      const to = fullOrder?.guestEmail ?? fullOrder?.user?.email;
      if (fullOrder && to) {
        await sendOrderConfirmationEmail({ to, order: fullOrder });
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      const orderId = session.metadata?.orderId;
      if (!paymentId || !orderId) break;

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.status !== "PENDING") break; // đã xử lý rồi thì bỏ qua

      await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED", rawPayload: event as unknown as object } });
      // Tín hiệu Stripe xác nhận CHẮC CHẮN không thanh toán nữa → trả tồn kho ngay,
      // không cần đợi job dọn Order PENDING quá hạn (job đó xử lý case KHÔNG có tín hiệu rõ ràng).
      await cancelOrderAndRestoreStock(orderId);
      break;
    }

    default:
      break; // các event khác chưa cần xử lý ở Phase này
  }

  return NextResponse.json({ received: true });
}