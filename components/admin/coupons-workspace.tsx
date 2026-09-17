"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Search } from "lucide-react";
import {
  Panel,
  ProgressRow,
  StatCard,
  StatusPill,
} from "@/components/admin/ui";
import { updateCouponAction } from "@/app/(admin)/admin/coupons/actions";

type CouponRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
};

type DisplayStatus = "active" | "scheduled" | "expired" | "inactive";

const statusStyle: Record<DisplayStatus, string> = {
  active: "border-emerald-400/40 text-emerald-300",
  scheduled: "border-sky-400/40 text-sky-300",
  expired: "border-border text-muted-foreground",
  inactive: "border-red-400/40 text-red-300",
};

const statusLabel: Record<DisplayStatus, string> = {
  active: "Đang bật",
  scheduled: "Lên lịch",
  expired: "Hết hạn",
  inactive: "Đã tắt",
};

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

// Coupon không có field `status` thật — suy ra từ isActive + startsAt/expiresAt.
function getStatus(c: CouponRow, now: number): DisplayStatus {
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return "expired";
  if (!c.isActive) return "inactive";
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return "scheduled";
  return "active";
}

export function CouponsWorkspace({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DisplayStatus>("all");
  const [copied, setCopied] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const now = Date.now();
  const withStatus = useMemo(
    () => coupons.map((c) => ({ ...c, displayStatus: getStatus(c, now) })),
    [coupons, now],
  );

  const filtered = useMemo(
    () =>
      withStatus.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) &&
          (status === "all" || c.displayStatus === status),
      ),
    [withStatus, query, status],
  );

  const activeCount = withStatus.filter(
    (c) => c.displayStatus === "active",
  ).length;
  const expiredCount = withStatus.filter(
    (c) => c.displayStatus === "expired",
  ).length;
  const totalUses = withStatus.reduce((sum, c) => sum + c.usedCount, 0);

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 1500);
  }

  // Archive/Restore = toggle isActive, dùng lại đúng updateCouponAction sẵn có,
  // không thêm field/action mới. Gửi nguyên payload hiện tại, chỉ đảo isActive.
  function toggleActive(c: CouponRow) {
    setPendingId(c.id);
    startTransition(async () => {
      const res = await updateCouponAction(c.id, {
        code: c.code,
        type: c.type,
        value: c.value,
        minOrderAmount: c.minOrderAmount,
        maxDiscountAmount: c.maxDiscountAmount,
        usageLimit: c.usageLimit,
        usageLimitPerUser: c.usageLimitPerUser,
        startsAt: c.startsAt ? c.startsAt.slice(0, 10) : null,
        expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : null,
        isActive: !c.isActive,
      });
      setPendingId(null);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          index="01"
          label="Tổng mã"
          value={String(withStatus.length)}
        />
        <StatCard index="02" label="Đang bật" value={String(activeCount)} />
        <StatCard index="03" label="Lượt đã dùng" value={String(totalUses)} />
        <StatCard index="04" label="Hết hạn" value={String(expiredCount)} />
      </div>

      <Panel title="Mã giảm giá" meta={`${filtered.length} mã`}>
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row">
          <label className="flex flex-1 items-center gap-2 border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã"
              className="w-full bg-transparent py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | DisplayStatus)}
            className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-foreground"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bật</option>
            <option value="scheduled">Lên lịch</option>
            <option value="expired">Hết hạn</option>
            <option value="inactive">Đã tắt</option>
          </select>
        </div>

        <div className="divide-y divide-border">
          {filtered.map((coupon) => (
            <div key={coupon.id} className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => copyCode(coupon.code)}
                    className="flex items-center gap-2 border border-dashed border-border px-3 py-1.5 font-hand text-sm tracking-[0.2em] text-foreground"
                  >
                    {coupon.code}
                    {copied === coupon.code ? (
                      <Check className="h-3 w-3 text-emerald-300" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                  <span className="text-[12px] text-muted-foreground">
                    {coupon.type === "PERCENTAGE"
                      ? `Giảm ${coupon.value}%`
                      : `Giảm ${fmt.format(coupon.value)}`}
                    {coupon.minOrderAmount
                      ? ` · đơn tối thiểu ${fmt.format(coupon.minOrderAmount)}`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill className={statusStyle[coupon.displayStatus]}>
                    {statusLabel[coupon.displayStatus]}
                  </StatusPill>
                  {coupon.displayStatus !== "expired" && (
                    <button
                      type="button"
                      onClick={() => toggleActive(coupon)}
                      disabled={isPending && pendingId === coupon.id}
                      className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      {coupon.isActive ? "Archive" : "Restore"}
                    </button>
                  )}
                  <Link
                    href={`/admin/coupons/${coupon.id}`}
                    className="text-[10px] uppercase tracking-[0.15em] text-foreground underline underline-offset-4"
                  >
                    Sửa →
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  {coupon.usageLimit !== null ? (
                    <ProgressRow
                      label="Đã dùng"
                      value={coupon.usedCount}
                      max={coupon.usageLimit}
                    />
                  ) : (
                    <span className="px-5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      Đã dùng {coupon.usedCount} lần
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {coupon.usageLimit !== null
                    ? `${coupon.usedCount}/${coupon.usageLimit} · `
                    : ""}
                  {coupon.expiresAt
                    ? `Hết hạn ${fmtDate(coupon.expiresAt)}`
                    : "Không hết hạn"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
            Không có mã nào khớp bộ lọc.
          </div>
        )}
      </Panel>
    </div>
  );
}
