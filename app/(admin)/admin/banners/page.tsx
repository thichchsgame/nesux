"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminButton, Panel, StatusPill } from "@/components/admin/ui";

// GIẢ TOÀN BỘ: schema chưa có Banner và trang chưa lưu CRUD thật.
type Banner = {
  id: string;
  title: string;
  subtitle: string;
  placement: string;
  status: "live" | "draft" | "scheduled";
  starts: string;
  ends: string;
};

const initialBanners: Banner[] = [
  {
    id: "B-01",
    title: "System 07 Drop",
    subtitle: "Bộ sưu tập mới — đang lên kệ",
    placement: "Hero",
    status: "live",
    starts: "2026-09-01",
    ends: "2026-09-30",
  },
  {
    id: "B-02",
    title: "Free Ship Trên 1.000.000đ",
    subtitle: "Tự động áp dụng khi thanh toán",
    placement: "Ticker",
    status: "live",
    starts: "2026-09-01",
    ends: "2026-12-31",
  },
];

const bannerStatus: Record<Banner["status"], string> = {
  live: "border-emerald-400/40 text-emerald-300",
  draft: "border-border text-muted-foreground",
  scheduled: "border-sky-400/40 text-sky-300",
};

export default function AdminBannersPage() {
  const [banners] = useState(initialBanners);

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar
        title="Banner"
        crumb="Banners"
        action={
          <AdminButton>
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Banner mới
          </AdminButton>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <Panel key={banner.id}>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                    {banner.id} / {banner.placement}
                  </span>
                  <h3 className="mt-2 font-hand text-lg font-bold uppercase tracking-tight text-foreground">
                    {banner.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {banner.subtitle}
                  </p>
                </div>
                <StatusPill className={bannerStatus[banner.status]}>
                  {banner.status}
                </StatusPill>
              </div>
              <div className="relative flex h-20 items-center justify-center overflow-hidden border border-border bg-foreground/[0.03]">
                <span className="font-hand text-sm uppercase tracking-[0.2em] text-foreground">
                  {banner.title}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                <span>
                  {banner.starts} → {banner.ends}
                </span>
                <div className="flex gap-4">
                  <button className="transition-colors hover:text-foreground">
                    Sửa
                  </button>
                  <button className="transition-colors hover:text-red-300">
                    Xoá
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
