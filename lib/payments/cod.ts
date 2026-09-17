import "server-only";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { Order, OrderItem } from "@/app/generated/prisma/client";

export async function createCodPayment(order: Order & { items: OrderItem[] }, email: string) {
  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "COD",
      status: "PENDING",
      amount: order.totalAmount,
      currency: "VND",
      idempotencyKey: crypto.randomUUID(),
    },
  });

  await sendOrderConfirmationEmail({ to: email, order });
  return `/checkout/success?order=${order.orderNumber}`;
}
