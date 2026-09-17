"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Panel,
  ProgressRow,
  StatCard,
  StatusPill,
} from "@/components/admin/ui";

type AnalyticsData = Awaited<
  ReturnType<typeof import("@/lib/analytics").getAnalyticsOverview>
>;

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const RANGES = ["7 ngày", "30 ngày", "90 ngày", "12 tháng"];

export function AnalyticsWorkspace({
  data,
  rangeLabel,
}: {
  data: AnalyticsData;
  rangeLabel: string;
}) {
  const [metric, setMetric] =
    useState<keyof typeof data.topProducts>("Số lượng");
  const maxTop = Math.max(...data.topProducts[metric].map((t) => t.value), 1);
  const maxCategory = Math.max(...data.salesByCategory.map((c) => c.value), 1);
  const maxCoupon = Math.max(...data.topCoupons.map((c) => c.value), 1);
  const maxLowStock = Math.max(...data.lowStockVariants.map((v) => v.value), 1);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
            Khoảng thời gian
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-foreground">
            {rangeLabel} — dữ liệu thật
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((item) => (
            <Link
              key={item}
              href={`/admin/analytics?range=${encodeURIComponent(item)}`}
              className={`px-3 py-2 text-[10px] uppercase tracking-[0.14em] ${
                rangeLabel === item
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          index="01"
          label="Doanh thu"
          value={fmt.format(data.totalRevenue)}
          delta={data.revenueDelta}
        />
        <StatCard
          index="02"
          label="Tổng đơn hàng"
          value={String(data.totalOrders)}
          delta={data.ordersDelta}
        />
        <StatCard
          index="03"
          label="Giá trị đơn TB"
          value={fmt.format(data.aov)}
        />
        <StatCard
          index="04"
          label="Khách quay lại"
          value={`${data.returningRate}%`}
        />
      </div>

      <Panel
        title="Xu hướng doanh thu"
        meta={`${data.totalOrders} đơn · AOV ${fmt.format(data.aov)}`}
      >
        {data.revenueTrend.length > 0 ? (
          <BarChart data={data.revenueTrend} unit="đ" />
        ) : (
          <p className="p-5 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
            Chưa có đơn hàng thành công trong khoảng thời gian này.
          </p>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Trạng thái đơn hàng" meta="Tỷ lệ theo số đơn">
          <div className="space-y-3 p-5">
            {data.ordersByStatus.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <StatusPill className={item.tone}>{item.label}</StatusPill>
                <span className="font-hand text-xl text-foreground">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Sản phẩm nổi bật"
          meta={
            <select
              value={metric}
              onChange={(e) =>
                setMetric(e.target.value as keyof typeof data.topProducts)
              }
              className="bg-transparent text-[10px] uppercase tracking-[0.12em] text-foreground outline-none"
            >
              {Object.keys(data.topProducts).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          }
        >
          <div className="py-3">
            {data.topProducts[metric].length > 0 ? (
              data.topProducts[metric].map((item) => (
                <ProgressRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={maxTop}
                />
              ))
            ) : (
              <p className="px-5 py-6 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
                Chưa có dữ liệu.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Doanh thu theo danh mục" meta="Tỷ lệ %">
        <div className="py-3">
          {data.salesByCategory.length > 0 ? (
            data.salesByCategory.map((item) => (
              <ProgressRow
                key={item.label}
                label={item.label}
                value={item.value}
                max={maxCategory}
              />
            ))
          ) : (
            <p className="px-5 py-6 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
              Chưa có dữ liệu.
            </p>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Mã giảm giá dùng nhiều nhất" meta="Lượt dùng">
          <div className="py-3">
            {data.topCoupons.length > 0 ? (
              data.topCoupons.map((item) => (
                <ProgressRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={maxCoupon}
                />
              ))
            ) : (
              <p className="px-5 py-6 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
                Chưa có mã nào được dùng.
              </p>
            )}
          </div>
        </Panel>
        <Panel title="Sắp hết hàng" meta="Tồn kho ≤ 5">
          <div className="py-3">
            {data.lowStockVariants.length > 0 ? (
              data.lowStockVariants.map((item) => (
                <ProgressRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  max={maxLowStock}
                />
              ))
            ) : (
              <p className="px-5 py-6 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
                Không có biến thể nào sắp hết hàng.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Nguồn truy cập & Phễu chuyển đổi"
        meta="Cần tích hợp tracking"
      >
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Chưa có dữ liệu lượt truy cập, nguồn traffic, tỷ lệ thoát và phễu
            chuyển đổi
          </p>
          <p className="max-w-md text-[11px] text-muted-foreground/70">
            Các chỉ số này đo hành vi trước khi tạo đơn hàng (xem sản phẩm, bỏ
            giỏ...) — hệ thống hiện chưa lưu pageview/session nên không thể
            tính, không hiển thị số giả.
          </p>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-foreground/[0.02] p-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Doanh thu ròng
          </p>
          <p className="mt-2 text-xs text-foreground">
            Doanh thu ròng không tính đơn đã huỷ và hoàn tiền.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-[10px] uppercase tracking-[0.18em] text-foreground underline underline-offset-4"
        >
          Xem đơn hàng →
        </Link>
      </div>
    </div>
  );
}
