"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Star } from "lucide-react";
import { deleteReviewAction } from "@/app/(storefront)/products/review-actions";
import { ReviewForm } from "@/components/product/review-form";

type ReviewItemData = { id: string; userId: string; rating: number; comment: string | null; colorSnapshot: string | null; sizeSnapshot: string | null; isVerifiedPurchase: boolean; adminReply: string | null; editedAt: string | Date | null; createdAt: string | Date; media: { id?: string; url: string; type: "IMAGE" | "VIDEO" }[]; user?: { name: string | null } | null };

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

export function ReviewItem({ review, productId, productSlug, isOwner }: { review: ReviewItemData; productId: string; productSlug: string; isOwner: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [helpful, setHelpful] = useState(false);
  const variantLabel = [review.colorSnapshot, review.sizeSnapshot].filter(Boolean).join(" / ");

  function handleDelete() {
    if (!confirm("Xoá đánh giá này? Bạn có thể viết lại đánh giá mới cho biến thể này sau.")) return;
    startTransition(async () => {
      const result = await deleteReviewAction(review.id, productSlug);
      if (result.ok) router.refresh();
    });
  }

  if (editing) return <div className="py-7"><ReviewForm mode="edit" reviewId={review.id} productId={productId} productSlug={productSlug} variantLabel={variantLabel} initial={{ rating: review.rating, comment: review.comment }} /></div>;

  return <article className="grid gap-5 py-7 md:grid-cols-[150px_1fr_120px] md:gap-8">
    <div><p className="text-sm text-foreground">{isOwner ? "Bạn" : review.user?.name ?? "Khách hàng"}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{formatDate(review.createdAt)}</p>{review.isVerifiedPurchase && <p className="mt-4 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground"><Check className="size-3" /> Đã mua hàng</p>}</div>
    <div>
      <div className="flex gap-0.5" aria-label={`${review.rating} trên 5 sao`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`size-3 ${index < review.rating ? "fill-foreground text-foreground" : "text-muted-foreground/40"}`} />)}</div>
      {variantLabel && <p className="mt-2 text-xs text-muted-foreground">{variantLabel}</p>}
      {review.comment && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{review.comment}</p>}
      {review.editedAt && <p className="mt-2 text-xs italic text-muted-foreground">Đã chỉnh sửa</p>}
      {review.media.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{review.media.map((media, index) => media.type === "VIDEO" ? <video key={media.id ?? index} src={media.url} controls className="h-20 w-32 object-cover bg-card" /> : <a key={media.id ?? index} href={media.url} target="_blank" rel="noopener noreferrer"><Image src={media.url} alt="Ảnh đánh giá" width={64} height={64} className="h-16 w-16 object-cover bg-card" /></a>)}</div>}
      {review.adminReply && <div className="mt-3 border-l-2 border-accent pl-3"><p className="mb-0.5 font-mono text-xs text-accent">NEXUS phản hồi</p><p className="text-sm text-muted-foreground">{review.adminReply}</p></div>}
      {isOwner && <div className="mt-3 flex gap-3"><button type="button" onClick={() => setEditing(true)} className="text-xs underline">Chỉnh sửa</button><button type="button" onClick={handleDelete} disabled={isPending} className="text-xs underline text-destructive">Xoá</button></div>}
    </div>
    <button type="button" onClick={() => setHelpful((value) => !value)} className="self-start text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground">Hữu ích {helpful ? "· 1" : ""}</button>
  </article>;
}
