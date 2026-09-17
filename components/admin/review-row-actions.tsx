"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/components/admin/ui";
import {
  setReviewStatusAction,
  replyToReviewAction,
  removeReplyAction,
} from "@/app/(admin)/admin/reviews/actions";

type Props = {
  reviewId: string;
  status: "PUBLISHED" | "HIDDEN";
  adminReply: string | null;
};

export function ReviewRowActions({ reviewId, status, adminReply }: Props) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(adminReply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleStatus() {
    setError(null);
    startTransition(async () => {
      const res = await setReviewStatusAction(
        reviewId,
        status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED",
      );
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function submitReply() {
    setError(null);
    startTransition(async () => {
      const res = await replyToReviewAction(reviewId, replyText);
      if (!res.ok) setError(res.error);
      else {
        setReplying(false);
        router.refresh();
      }
    });
  }

  function deleteReply() {
    setError(null);
    startTransition(async () => {
      const res = await removeReplyAction(reviewId);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <AdminButton
          variant="ghost"
          onClick={toggleStatus}
          disabled={isPending}
        >
          {status === "PUBLISHED" ? "Ẩn đánh giá" : "Hiện lại"}
        </AdminButton>
        <AdminButton
          variant="ghost"
          onClick={() => setReplying((v) => !v)}
          disabled={isPending}
        >
          {adminReply ? "Sửa trả lời" : "Trả lời"}
        </AdminButton>
        {adminReply && (
          <AdminButton
            variant="ghost"
            onClick={deleteReply}
            disabled={isPending}
          >
            Xoá trả lời
          </AdminButton>
        )}
      </div>

      {replying && (
        <div className="flex gap-3">
          <textarea
            aria-label="Trả lời đánh giá"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Trả lời công khai đánh giá này..."
            className="min-h-12 flex-1 resize-none border border-border bg-background px-3 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <AdminButton onClick={submitReply} disabled={isPending}>
            Gửi
          </AdminButton>
        </div>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
