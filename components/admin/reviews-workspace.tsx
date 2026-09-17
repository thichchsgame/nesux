"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  Star,
} from "lucide-react";
import { Panel, StatCard, StatusPill } from "@/components/admin/ui";
import { ReviewRowActions } from "@/components/admin/review-row-actions";

type MediaItem = { id: string; url: string; type: "IMAGE" | "VIDEO" };

type ReviewRow = {
  id: string;
  customerName: string;
  productName: string;
  variant: string;
  rating: number;
  comment: string | null;
  status: "PUBLISHED" | "HIDDEN";
  adminReply: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  media: MediaItem[];
};

const PAGE_SIZE = 6;

export function ReviewsWorkspace({ reviews }: { reviews: ReviewRow[] }) {
  const [selectedId, setSelectedId] = useState(reviews[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "needs" | "replied" | "hidden">(
    "all",
  );
  const [rating, setRating] = useState<"all" | "1" | "2" | "3" | "4" | "5">(
    "all",
  );
  const [sort, setSort] = useState<"newest" | "oldest" | "rating">("newest");
  const [page, setPage] = useState(1);

  const total = reviews.length;
  const awaiting = reviews.filter(
    (r) => r.status === "PUBLISHED" && !r.adminReply,
  ).length;
  const hidden = reviews.filter((r) => r.status === "HIDDEN").length;
  const verifiedPct =
    total > 0
      ? Math.round(
          (reviews.filter((r) => r.isVerifiedPurchase).length / total) * 100,
        )
      : 0;

  const filtered = useMemo(() => {
    return reviews
      .filter((r) => {
        const haystack =
          `${r.customerName} ${r.productName} ${r.comment ?? ""}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        const matchesStatus =
          status === "all" ||
          (status === "needs" && r.status === "PUBLISHED" && !r.adminReply) ||
          (status === "replied" && !!r.adminReply) ||
          (status === "hidden" && r.status === "HIDDEN");
        const matchesRating = rating === "all" || r.rating === Number(rating);
        return matchesQuery && matchesStatus && matchesRating;
      })
      .sort((a, b) =>
        sort === "rating"
          ? b.rating - a.rating
          : sort === "oldest"
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt),
      );
  }, [reviews, query, status, rating, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected =
    reviews.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index="01" label="Tổng đánh giá" value={String(total)} />
        <StatCard
          index="02"
          label="Chờ trả lời"
          value={String(awaiting).padStart(2, "0")}
        />
        <StatCard
          index="03"
          label="Đã ẩn"
          value={String(hidden).padStart(2, "0")}
        />
        <StatCard index="04" label="Khách đã mua" value={`${verifiedPct}%`} />
      </div>

      <Panel className="overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="flex flex-1 items-center gap-2 border border-border px-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                aria-label="Tìm đánh giá"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm khách hàng, sản phẩm, nội dung..."
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPage(1);
              }}
              className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="needs">Chờ trả lời</option>
              <option value="replied">Đã trả lời</option>
              <option value="hidden">Đã ẩn</option>
            </select>
            <select
              value={rating}
              onChange={(e) => {
                setRating(e.target.value as typeof rating);
                setPage(1);
              }}
              className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground"
            >
              <option value="all">Tất cả sao</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} sao
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="rating">Sao cao nhất</option>
            </select>
          </div>
        </div>

        <div className="grid min-h-[600px] md:grid-cols-[330px_1fr]">
          <aside className="border-b border-border md:border-b-0 md:border-r">
            <div className="divide-y divide-border">
              {visible.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(r.id);
                  }}
                  className={`block w-full p-4 text-left transition-colors hover:bg-foreground/[0.04] ${selected?.id === r.id ? "bg-foreground/[0.06]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12px] text-foreground">
                      {r.customerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {r.productName}
                    {r.variant ? ` / ${r.variant}` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${i < r.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </span>
                    {r.status === "HIDDEN" ? (
                      <StatusPill className="border-red-300/30 text-red-300">
                        Đã ẩn
                      </StatusPill>
                    ) : r.adminReply ? (
                      <StatusPill className="border-emerald-300/30 text-emerald-300">
                        Đã trả lời
                      </StatusPill>
                    ) : (
                      <StatusPill className="border-amber-300/30 text-amber-300">
                        Chờ trả lời
                      </StatusPill>
                    )}
                  </div>
                </button>
              ))}
              {visible.length === 0 && (
                <div className="p-6 text-center text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
                  Không có đánh giá nào khớp bộ lọc.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                Trang {page} / {pages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={page === 1}
                  onClick={() => setPage((v) => Math.max(1, v - 1))}
                  className="border border-border p-2 text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={page === pages}
                  onClick={() => setPage((v) => Math.min(pages, v + 1))}
                  className="border border-border p-2 text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </aside>

          {selected ? (
            <section className="flex min-h-[600px] flex-col">
              <header className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {selected.productName}
                    {selected.variant ? ` · ${selected.variant}` : ""}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {selected.customerName} ·{" "}
                    {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                {selected.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300">
                    <Check className="size-3" /> Đã mua hàng
                  </span>
                )}
              </header>

              <div className="flex flex-1 flex-col gap-5 p-6">
                <div className="max-w-2xl">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${i < selected.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-5 text-[14px] leading-7 text-muted-foreground">
                    {selected.comment ?? "Khách không để lại nội dung."}
                  </p>

                  {selected.media.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {selected.media.map((m) =>
                        m.type === "VIDEO" ? (
                          <video
                            key={m.id}
                            src={m.url}
                            controls
                            className="h-20 w-20 object-cover"
                          />
                        ) : (
                          <a
                            key={m.id}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={m.url}
                              alt=""
                              loading="lazy"
                              className="h-20 w-20 object-cover"
                            />
                          </a>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {selected.adminReply && (
                  <div className="flex max-w-[78%] items-start gap-3 self-end border border-border bg-foreground/[0.06] p-4">
                    <MessageSquare className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                        NEXUS · phản hồi công khai
                      </p>
                      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                        {selected.adminReply}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-5">
                <ReviewRowActions
                  reviewId={selected.id}
                  status={selected.status}
                  adminReply={selected.adminReply}
                />
              </div>
            </section>
          ) : (
            <div className="flex items-center justify-center text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
              Chọn 1 đánh giá để xem
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
