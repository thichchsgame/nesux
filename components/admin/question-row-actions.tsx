"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { answerQuestionAction, removeAnswerAction, setQuestionStatusAction } from "@/app/(admin)/admin/questions/actions";

type Props = { questionId: string; status: "PUBLISHED" | "HIDDEN"; answer: string | null };

export function QuestionRowActions({ questionId, status, answer }: Props) {
  const router = useRouter();
  const [answering, setAnswering] = useState(false);
  const [answerText, setAnswerText] = useState(answer ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      onSuccess?.();
      router.refresh();
    });
  }

  return <div className="space-y-2 min-w-[160px]">
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => run(() => setQuestionStatusAction(questionId, status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED"))} disabled={isPending}>{status === "PUBLISHED" ? "Ẩn" : "Hiện lại"}</Button>
      <Button size="sm" variant="outline" onClick={() => setAnswering((value) => !value)} disabled={isPending}>{answer ? "Sửa trả lời" : "Trả lời"}</Button>
      {answer && <Button size="sm" variant="outline" onClick={() => run(() => removeAnswerAction(questionId))} disabled={isPending}>Xoá trả lời</Button>}
    </div>
    {answering && <div className="space-y-2"><textarea value={answerText} onChange={(event) => setAnswerText(event.target.value)} rows={2} className="w-full border border-dashed border-input px-2 py-1.5 text-sm bg-transparent focus:outline-none focus:border-solid focus:border-accent" /><Button size="sm" onClick={() => run(() => answerQuestionAction(questionId, answerText), () => setAnswering(false))} disabled={isPending}>Gửi</Button></div>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>;
}
