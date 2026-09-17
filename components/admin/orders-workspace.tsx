"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Panel, StatCard, StatusPill } from "@/components/admin/ui";
import { orderStatusLabel } from "@/lib/order-status";

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string | null;
  paymentProvider: string | null;
  totalAmount: number;
  createdAt: string;
};

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const statusStyle: Record<string, string> = {
  PENDING: "border-amber-400/40 text-amber-300",
  PAID: "border-sky-400/40 text-sky-300",
  PROCESSING: "border-sky-400/40 text-sky-300",
  SHIPPED: "border-blue-400/40 text-blue-300",
  DELIVERED: "border-emerald-400/40 text-emerald-300",
  CANCELLED: "border-red-400/40 text-red-300",
  REFUNDED: "border-border text-muted-foreground",
};

const paymentLabel: Record<string, string> = {
  PENDING: "Chờ",
  SUCCEEDED: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn",
};

const paymentStyle: Record<string, string> = {
  PENDING: "border-amber-400/40 text-amber-300",
  SUCCEEDED: "border-emerald-400/40 text-emerald-300",
  FAILED: "border-red-400/40 text-red-300",
  REFUNDED: "border-border text-muted-foreground",
};

const PAGE_SIZE = 8;

export function OrdersWorkspace({
  orders,
  total,
  summary,
}: {
  orders: OrderRow[];
  total: number;
  summary: {
    total: number;
    awaiting: number;
    inTransit: number;
    netRevenue: number;
  };
}) {
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState("Tất cả trạng thái");
  const [payment, setPayment] = useState("Tất cả thanh toán");
  const [sort, setSort] = useState("Mới nhất");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const result = orders.filter((o) => {
      const matchesQuery =
        `${o.orderNumber} ${o.customerName} ${o.customerEmail}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesFulfillment =
        fulfillment === "Tất cả trạng thái" ||
        orderStatusLabel[o.status as keyof typeof orderStatusLabel] ===
          fulfillment;
      const matchesPayment =
        payment === "Tất cả thanh toán" ||
        (o.paymentStatus && paymentLabel[o.paymentStatus] === payment);
      return matchesQuery && matchesFulfillment && matchesPayment;
    });

    return [...result].sort((a, b) =>
      sort === "Cũ nhất"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  }, [orders, query, fulfillment, payment, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border border-border bg-foreground/[0.02] p-3 lg:flex-row">
        <label className="flex flex-1 items-center gap-2 border border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã đơn, khách hàng, email..."
            className="w-full bg-transparent py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </label>

        <select
          value={fulfillment}
          onChange={(e) => {
            setFulfillment(e.target.value);
            setPage(1);
          }}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground"
        >
          <option>Tất cả trạng thái</option>
          {Object.values(orderStatusLabel).map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>

        <select
          value={payment}
          onChange={(e) => {
            setPayment(e.target.value);
            setPage(1);
          }}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground"
        >
          <option>Tất cả thanh toán</option>
          {Object.values(paymentLabel).map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground"
        >
          <option>Mới nhất</option>
          <option>Cũ nhất</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          index="01"
          label="Tổng đơn hàng"
          value={String(summary.total)}
        />
        <StatCard
          index="02"
          label="Cần xử lý"
          value={String(summary.awaiting)}
        />
        <StatCard
          index="03"
          label="Đang giao"
          value={String(summary.inTransit)}
        />
        <StatCard
          index="04"
          label="Doanh thu ròng"
          value={fmt.format(summary.netRevenue)}
        />
      </div>

      <Panel title="Đơn hàng" meta={`${filtered.length} / ${total} bản ghi`}>
        <div className="hidden grid-cols-[1fr_1.5fr_1fr_0.9fr_0.9fr_0.8fr] gap-4 border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 md:grid">
          <span>Mã đơn</span>
          <span>Khách hàng</span>
          <span>Ngày</span>
          <span>Thanh toán</span>
          <span>Vận chuyển</span>
          <span className="text-right">Tổng tiền</span>
        </div>

        <div className="divide-y divide-border">
          {visible.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.orderNumber}`}
              className="grid grid-cols-2 gap-4 px-5 py-4 text-left text-[13px] transition-colors hover:bg-foreground/[0.03] md:grid-cols-[1fr_1.5fr_1fr_0.9fr_0.9fr_0.8fr] md:items-center"
            >
              <span className="font-hand tracking-wide text-foreground">
                {o.orderNumber}
              </span>

              <span>
                <b className="block font-normal text-foreground">
                  {o.customerName}
                </b>
                <small className="text-[11px] text-muted-foreground">
                  {o.customerEmail}
                </small>
              </span>

              <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                {new Date(o.createdAt).toLocaleDateString("vi-VN")}
              </span>

              <span>
                {o.paymentStatus && (
                  <StatusPill
                    className={
                      paymentStyle[o.paymentStatus] ??
                      "border-border text-muted-foreground"
                    }
                  >
                    {paymentLabel[o.paymentStatus] ?? o.paymentStatus}
                  </StatusPill>
                )}
              </span>

              <span>
                <StatusPill
                  className={
                    statusStyle[o.status] ??
                    "border-border text-muted-foreground"
                  }
                >
                  {orderStatusLabel[
                    o.status as keyof typeof orderStatusLabel
                  ] ?? o.status}
                </StatusPill>
              </span>

              <span className="text-right font-hand text-foreground">
                {fmt.format(o.totalAmount)}
              </span>
            </Link>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="px-5 py-12 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
            Không có đơn hàng khớp bộ lọc.
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              aria-label="Trang trước"
              disabled={page === 1}
              onClick={() => setPage((v) => Math.max(1, v - 1))}
              className="border border-border p-2 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Trang sau"
              disabled={page === totalPages}
              onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              className="border border-border p-2 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
