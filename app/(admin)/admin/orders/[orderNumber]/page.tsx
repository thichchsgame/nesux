import { notFound } from "next/navigation";
import { getOrderForAdmin } from "@/lib/orders";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Panel, StatusPill } from "@/components/admin/ui";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
const statusLabel: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
  REFUNDED: "Đã hoàn tiền",
};
const statusStyle: Record<string, string> = {
  PENDING: "border-amber-400/40 text-amber-300",
  PAID: "border-sky-400/40 text-sky-300",
  PROCESSING: "border-sky-400/40 text-sky-300",
  SHIPPED: "border-blue-400/40 text-blue-300",
  DELIVERED: "border-emerald-400/40 text-emerald-300",
  CANCELLED: "border-red-400/40 text-red-300",
  REFUNDED: "border-border text-muted-foreground",
};
const paymentStyle: Record<string, string> = {
  SUCCEEDED: "border-emerald-400/40 text-emerald-300",
  PENDING: "border-amber-400/40 text-amber-300",
  FAILED: "border-red-400/40 text-red-300",
  REFUNDED: "border-border text-muted-foreground",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrderForAdmin(orderNumber);
  if (!order) notFound();

  const latestPayment = order.payments[0];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Admin / Orders / {order.orderNumber}
          </p>
          <h1 className="mt-2 font-hand text-3xl font-bold uppercase tracking-tight text-foreground">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.user?.name ?? order.guestEmail ?? "Khách vãng lai"} — Cập
            nhật {new Date(order.updatedAt).toLocaleString("vi-VN")}
          </p>
        </div>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border border-border p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
            Thanh toán
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-foreground">
              {latestPayment ? latestPayment.provider : "—"}
            </span>
            {latestPayment && (
              <StatusPill
                className={
                  paymentStyle[latestPayment.status] ??
                  "border-border text-muted-foreground"
                }
              >
                {latestPayment.status}
              </StatusPill>
            )}
          </div>
        </div>
        <div className="border border-border p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
            Vận chuyển
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-foreground">
              {order.trackingCode ?? "Chưa có mã vận đơn"}
            </span>
            <StatusPill className={statusStyle[order.status]}>
              {statusLabel[order.status]}
            </StatusPill>
          </div>
        </div>
      </div>

      <Panel title="Sản phẩm">
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between px-5 py-4 text-sm"
            >
              <span className="text-foreground">
                {item.productNameSnapshot}{" "}
                <span className="text-muted-foreground">
                  {[item.sizeSnapshot, item.colorSnapshot]
                    .filter(Boolean)
                    .join(" / ")}{" "}
                  × {item.quantity}
                </span>
              </span>
              <span className="font-hand text-foreground">
                {fmt.format(Number(item.lineTotal))}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính</span>
            <span>{fmt.format(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Vận chuyển</span>
            <span>{fmt.format(Number(order.shippingFee))}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Giảm giá</span>
              <span>-{fmt.format(Number(order.discountAmount))}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-hand text-base text-foreground">
            <span>Tổng cộng</span>
            <span>{fmt.format(Number(order.totalAmount))}</span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Khách hàng">
          <div className="px-5 py-4 text-sm">
            <p className="text-foreground">
              {order.user?.name ?? "Khách vãng lai"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {order.user?.email ?? order.guestEmail}
            </p>
          </div>
        </Panel>
        <Panel title="Giao đến">
          <div className="px-5 py-4 text-sm">
            <p className="text-foreground">
              {order.shippingFullName} · {order.shippingPhone}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {[order.shippingLine1, order.shippingWard, order.shippingCity]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Lịch sử trạng thái">
        {order.statusEvents.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">
            Chưa có sự kiện nào.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {order.statusEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground" />
                <div>
                  <p className="text-foreground">
                    {event.note || statusLabel[event.status]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
