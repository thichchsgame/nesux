import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listOrdersByUser } from "@/lib/orders";
import { OrdersView } from "@/components/account/orders-view";

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const orders = await listOrdersByUser(session.user.id);

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-6 text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
        <a
          href="/products"
          className="font-hand text-lg text-foreground underline"
        >
          Bắt đầu mua sắm →
        </a>
      </div>
    );
  }

  const items = orders.map((order) => {
    const provider = order.payments[0]?.provider;
    const lastPaymentProvider: "STRIPE" | "VNPAY" | "COD" =
      provider === "STRIPE" || provider === "VNPAY" || provider === "COD"
        ? provider
        : "COD";

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      totalAmount: Number(order.totalAmount),
      trackingCode: order.trackingCode,
      shippingFullName: order.shippingFullName,
      shippingPhone: order.shippingPhone,
      shippingLine1: order.shippingLine1,
      shippingWard: order.shippingWard,
      shippingCity: order.shippingCity,
      lastPaymentProvider,
      items: order.items.map((i) => ({
        productNameSnapshot: i.productNameSnapshot,
        sizeSnapshot: i.sizeSnapshot,
        colorSnapshot: i.colorSnapshot,
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
      statusEvents: order.statusEvents.map((e) => ({
        status: e.status,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  });

  return <OrdersView orders={items} />;
}
