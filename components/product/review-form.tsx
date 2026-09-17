"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createReviewAction, updateReviewAction } from "@/app/(storefront)/products/review-actions";

const MAX_MEDIA = 5;

type Props = {
  productId: string;
  productSlug: string;
  variantLabel?: string;
} & (
  | { mode: "create"; orderItemId: string; reviewId?: undefined; initial?: undefined }
  | { mode: "edit"; orderItemId?: undefined; reviewId: string; initial: { rating: number; comment: string | null } }
);

export function ReviewForm(props: Props) {
  const { productId, productSlug, variantLabel } = props;
  const router = useRouter();
  const [rating, setRating] = useState(props.mode === "edit" ? props.initial.rating : 5);
  const [comment, setComment] = useState(props.mode === "edit" ? props.initial.comment ?? "" : "");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []).slice(0, MAX_MEDIA));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const data = { rating, comment: comment || undefined };
    startTransition(async () => {
      const result = props.mode === "create"
        ? await createReviewAction(productId, productSlug, props.orderItemId, data, files)
        : await updateReviewAction(props.reviewId, productSlug, data, files);
      if (!result.ok) return setError(result.error);
      setSuccess(true);
      router.refresh();
    });
  }

  if (success) return <p className="text-sm text-accent font-mono">{props.mode === "create" ? "Cảm ơn bạn đã đánh giá!" : "Đã cập nhật đánh giá."}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-hand text-lg">{props.mode === "create" ? "Viết đánh giá" : "Sửa đánh giá"}{variantLabel && <span className="text-sm text-muted-foreground font-sans"> — {variantLabel}</span>}</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className={`text-2xl leading-none ${value <= rating ? "text-accent" : "text-muted-foreground"}`}>★</button>)}
      </div>
      <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Chia sẻ cảm nhận của bạn (không bắt buộc)" rows={3} className="w-full border-0 border-b border-dashed border-input px-0.5 py-2.5 text-sm bg-transparent focus:outline-none focus:border-solid focus:border-accent" />
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground block">ẢNH/VIDEO (tối đa {MAX_MEDIA}, ảnh ≤5MB, video ≤20MB)</label>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple onChange={handleFileChange} className="text-sm" />
        {props.mode === "edit" && <p className="text-xs text-muted-foreground italic">Chọn media mới sẽ thay thế toàn bộ media cũ. Bỏ trống nếu muốn giữ nguyên media hiện tại.</p>}
        {files.length > 0 && <div className="flex gap-2 mt-1 flex-wrap">{files.map((file) =>
          file.type.startsWith("video/") ? (
            <video key={`${file.name}-${file.lastModified}`} src={URL.createObjectURL(file)} muted className="w-14 h-14 object-cover" />
          ) : (
            // Blob URLs cannot be rendered by next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${file.name}-${file.lastModified}`} src={URL.createObjectURL(file)} alt="" className="w-14 h-14 object-cover" />
          )
        )}</div>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Đang gửi..." : props.mode === "create" ? "Gửi đánh giá" : "Lưu thay đổi"}</Button>
    </form>
  );
}
