import { listAllOrders, getOrderSummaryStats } from "@/lib/orders";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { OrdersWorkspace } from "@/components/admin/orders-workspace";

export default async function AdminOrdersPage() {
  const [{ orders, total }, summary] = await Promise.all([
    listAllOrders({ pageSize: 1000 }),
    getOrderSummaryStats(),
  ]);

  const rows = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.user?.name ?? o.guestEmail ?? "Khách vãng lai",
    customerEmail: o.user?.email ?? o.guestEmail ?? "",
    status: o.status,
    paymentStatus: o.payments[0]?.status ?? null,
    paymentProvider: o.payments[0]?.provider ?? null,
    totalAmount: Number(o.totalAmount),
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Đơn hàng" crumb="Orders" />
      <OrdersWorkspace orders={rows} total={total} summary={summary} />
    </div>
  );
}
