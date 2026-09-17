"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createQuestionAction } from "@/app/(storefront)/products/question-actions";
import { Button } from "@/components/ui/button";

export function QuestionForm({ productId, productSlug }: { productId: string; productSlug: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createQuestionAction(productId, productSlug, text);
      if (!result.ok) return setError(result.error);
      setText("");
      setSuccess(true);
      router.refresh();
    });
  }

  if (success) return <p className="text-sm text-accent font-mono">Đã gửi câu hỏi, cảm ơn bạn!</p>;

  return <form onSubmit={handleSubmit} className="space-y-3">
    <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Đặt câu hỏi về sản phẩm này..." rows={2} className="w-full border-0 border-b border-dashed border-input px-0.5 py-2 text-sm bg-transparent focus:outline-none focus:border-solid focus:border-accent" />
    {error && <p className="text-sm text-destructive">{error}</p>}
    <Button type="submit" size="sm" disabled={isPending || !text.trim()}>{isPending ? "Đang gửi..." : "Đặt câu hỏi"}</Button>
  </form>;
}
