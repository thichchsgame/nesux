"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Package,
  RefreshCcw,
  Star,
} from "lucide-react";
import {
  AdminButton,
  BarChart,
  Panel,
  ProgressRow,
  StatCard,
  StatusPill,
} from "@/components/admin/ui";

const periods = ["Hôm nay", "7 ngày", "30 ngày", "12 tháng"] as const;

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

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

type Stats = Awaited<
  ReturnType<typeof import("@/lib/dashboard").getDashboardStats>
>;

export function DashboardClient({ stats }: { stats: Stats }) {
  const [period, setPeriod] = useState<(typeof periods)[number]>("30 ngày");
  const [showPeriods, setShowPeriods] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const maxCategory = Math.max(...stats.salesByCategory.map((c) => c.value), 1);
  const attentionCount =
    stats.pendingCount + stats.lowStockVariants.length + stats.outOfStockCount;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
            Admin / Overview
          </p>
          <h1 className="mt-2 font-hand text-4xl font-bold uppercase tracking-tight text-foreground">
            Tổng quan
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground/70">
            Trung tâm điều hành NEXUS
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPeriods((v) => !v)}
              className="inline-flex items-center gap-3 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              <CalendarDays className="h-3.5 w-3.5" /> {period}{" "}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showPeriods && (
              <div className="absolute right-0 top-11 z-20 min-w-36 border border-border bg-background p-1">
                {periods.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setPeriod(option);
                      setShowPeriods(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <AdminButton variant="ghost" onClick={() => setDismissed(false)}>
            <RefreshCcw className="h-3.5 w-3.5" /> Làm mới
          </AdminButton>
        </div>
      </div>

      {!dismissed && attentionCount > 0 && (
        <div className="flex items-start justify-between gap-4 border border-amber-300/20 bg-amber-300/[0.04] px-4 py-3 text-amber-200">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                Cần xử lý
              </p>
              <p className="mt-1 text-xs text-amber-200/80">
                {stats.pendingCount} đơn cần xử lý và{" "}
                {stats.lowStockVariants.length + stats.outOfStockCount} sản phẩm
                cần chú ý tồn kho.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-amber-200/60 hover:text-foreground"
          >
            Bỏ qua
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          index="01"
          label="Doanh thu ròng"
          value={fmt.format(stats.totalRevenue)}
        />
        <StatCard
          index="02"
          label="Đơn hàng"
          value={String(stats.totalOrders)}
        />
        <StatCard
          index="03"
          label="Khách hàng"
          value={String(stats.customersCount)}
        />
        <StatCard
          index="04"
          label="Giá trị TB / đơn"
          value={fmt.format(stats.avgOrderValue)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Chờ xử lý"
          value={stats.pendingCount}
          href="/admin/orders?status=PENDING"
        />
        <Metric
          label="Sắp hết hàng"
          value={stats.lowStockVariants.length}
          href="/admin/products"
        />
        <Metric
          label="Hết hàng"
          value={stats.outOfStockCount}
          href="/admin/products"
        />
        <Metric
          label="Đã huỷ / hoàn tiền"
          value={stats.negativeCount}
          href="/admin/orders?status=CANCELLED"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Doanh thu"
          meta="7 ngày gần nhất"
          className="lg:col-span-2"
        >
          {stats.revenueTrend.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-muted-foreground">
              Chưa có doanh thu trong 7 ngày qua.
            </p>
          ) : (
            <BarChart data={stats.revenueTrend} unit="đ" />
          )}
        </Panel>
        <Panel title="Doanh thu theo danh mục" meta="Tỷ lệ %">
          <div className="py-3">
            {stats.salesByCategory.length === 0 ? (
              <p className="px-5 text-sm text-muted-foreground">
                Chưa có dữ liệu.
              </p>
            ) : (
              stats.salesByCategory.map((c) => (
                <ProgressRow
                  key={c.label}
                  label={c.label}
                  value={c.value}
                  max={maxCategory}
                />
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Đơn hàng gần đây"
          meta={
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              Xem tất cả <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
          className="lg:col-span-2"
        >
          {stats.recentOrders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Chưa có đơn hàng nào.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentOrders.map((o) => (
                <Link
                  href="/admin/orders"
                  key={o.orderNumber}
                  className="flex items-center justify-between gap-4 px-5 py-4 text-[13px] hover:bg-foreground/[0.02]"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-hand tracking-wide text-foreground">
                      {o.orderNumber}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {o.customerName}
                    </span>
                  </div>
                  <StatusPill className={statusStyle[o.status]}>
                    {statusLabel[o.status]}
                  </StatusPill>
                  <span className="w-24 shrink-0 text-right font-hand text-foreground">
                    {fmt.format(o.totalAmount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Thao tác nhanh" meta="Operations">
          <div className="grid gap-2 p-3">
            {[
              [Package, "Quản lý sản phẩm", "/admin/products"],
              [Star, "Xem đánh giá", "/admin/reviews"],
              [CircleAlert, "Hỗ trợ khách hàng", "/admin/support"],
            ].map(([Icon, label, href]) => (
              <Link
                key={String(label)}
                href={String(href)}
                className="flex items-center justify-between border border-border px-3 py-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  {typeof Icon !== "string" && <Icon className="h-3.5 w-3.5" />}{" "}
                  {String(label)}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border border-border bg-foreground/[0.02] p-4 transition-colors hover:border-foreground/30"
    >
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between">
        <span className="font-hand text-2xl text-foreground">{value}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60" />
      </div>
    </Link>
  );
}
