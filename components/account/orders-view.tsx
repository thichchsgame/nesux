"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { PaymentActionsPanel } from "@/components/checkout/payment-actions-panel";

type OrderStatusType =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type OrderItem = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatusType;
  totalAmount: number;
  trackingCode: string | null;
  shippingFullName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingWard: string | null;
  shippingCity: string;
  lastPaymentProvider: "STRIPE" | "VNPAY" | "COD";
  items: {
    productNameSnapshot: string;
    sizeSnapshot: string | null;
    colorSnapshot: string | null;
    quantity: number;
    lineTotal: number;
  }[];
  statusEvents: {
    status: OrderStatusType;
    note: string | null;
    createdAt: string;
  }[];
};

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("vi-VN");

const STATUS_LABEL: Record<OrderStatusType, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã huỷ",
  REFUNDED: "Đã hoàn tiền",
};

const STATUS_PROGRESS: Record<OrderStatusType, number> = {
  PENDING: 10,
  PAID: 30,
  PROCESSING: 50,
  SHIPPED: 80,
  DELIVERED: 100,
  CANCELLED: 0,
  REFUNDED: 100,
};

const STATUS_DOT: Record<OrderStatusType, string> = {
  PENDING: "bg-amber-400",
  PAID: "bg-sky-400",
  PROCESSING: "bg-sky-400 animate-pulse",
  SHIPPED: "bg-blue-400 animate-pulse",
  DELIVERED: "bg-emerald-400",
  CANCELLED: "bg-red-400",
  REFUNDED: "bg-zinc-400",
};

function StatusBadge({ status }: { status: OrderStatusType }) {
  const isNegative = status === "CANCELLED";
  return (
    <span
      className={`flex items-center gap-1.5 border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
        isNegative
          ? "border-destructive/40 text-destructive"
          : "border-foreground/30 text-foreground"
      }`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function ProgressBar({ status }: { status: OrderStatusType }) {
  const pct = STATUS_PROGRESS[status];
  return (
    <div className="h-1 w-full bg-border">
      <div
        className={`h-full ${
          status === "CANCELLED" ? "bg-destructive/50" : "bg-foreground"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function OrdersView({ orders }: { orders: OrderItem[] }) {
  const [selectedId, setSelectedId] = useState(orders[0].id);
  const selected = orders.find((o) => o.id === selectedId) ?? orders[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => setSelectedId(order.id)}
            className={`block w-full border p-5 text-left transition-colors ${
              selectedId === order.id
                ? "border-foreground"
                : "border-border hover:border-foreground/40"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-sm text-foreground">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {fmtDate(order.createdAt)} /{" "}
              {order.items.map((i) => i.productNameSnapshot).join(", ")}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <ProgressBar status={order.status} />
              </div>
              <span className="font-mono text-sm font-bold text-foreground">
                {fmt.format(order.totalAmount)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Chi tiết đơn hàng
            </p>
            <h3 className="mt-2 font-hand text-2xl uppercase text-foreground">
              {selected.orderNumber}
            </h3>
          </div>
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Sản phẩm
          </p>
          <div className="mt-2 space-y-2">
            {selected.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm text-foreground"
              >
                <span>
                  {item.productNameSnapshot}
                  {item.sizeSnapshot || item.colorSnapshot
                    ? ` / ${[item.sizeSnapshot, item.colorSnapshot]
                        .filter(Boolean)
                        .join(" / ")}`
                    : ""}{" "}
                  × {item.quantity}
                </span>
                <span className="font-mono">{fmt.format(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {selected.trackingCode && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Mã vận đơn (GHN)
            </p>
            <p className="mt-2 font-mono text-sm text-foreground">
              {selected.trackingCode}
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Địa chỉ giao hàng
          </p>
          <div className="mt-2 text-sm text-foreground">
            <p>
              {selected.shippingFullName} · {selected.shippingPhone}
            </p>
            <p className="mt-1 text-muted-foreground">
              {[
                selected.shippingLine1,
                selected.shippingWard,
                selected.shippingCity,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Lịch sử đơn hàng
          </p>
          <div className="mt-3 space-y-3">
            {selected.statusEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 bg-foreground" />
                <div>
                  <p className="text-foreground">
                    {event.note || STATUS_LABEL[event.status]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDateTime(event.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected.status === "PENDING" && (
          <PaymentActionsPanel
            orderNumber={selected.orderNumber}
            currentProvider={selected.lastPaymentProvider}
          />
        )}
      </div>
    </div>
  );
}
