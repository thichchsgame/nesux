"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestionAction, updateQuestionAction } from "@/app/(storefront)/products/question-actions";
import { Button } from "@/components/ui/button";

type QuestionItemData = { id: string; question: string; answer: string | null; editedAt: string | Date | null; user?: { name: string | null } | null };

export function QuestionItem({ question, productSlug, isOwner }: { question: QuestionItemData; productSlug: string; isOwner: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(question.question);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function save() { setError(null); startTransition(async () => { const result = await updateQuestionAction(question.id, productSlug, text); if (!result.ok) return setError(result.error); setEditing(false); router.refresh(); }); }
  function remove() { if (!confirm("Xoá câu hỏi này?")) return; startTransition(async () => { const result = await deleteQuestionAction(question.id, productSlug); if (!result.ok) return setError(result.error); router.refresh(); }); }

  return <article className="grid gap-3 py-6 md:grid-cols-2 md:gap-8">
    <div><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{isOwner ? "Bạn hỏi" : "Câu hỏi"}</p>{question.editedAt && <span className="text-[10px] italic text-muted-foreground">· Đã chỉnh sửa</span>}</div>
      {editing ? <div className="mt-2 space-y-2"><textarea value={text} onChange={(event) => setText(event.target.value)} rows={2} className="w-full border-0 border-b border-dashed border-input bg-transparent px-0.5 py-1.5 text-sm focus:border-accent focus:border-solid focus:outline-none" />{error && <p className="text-xs text-destructive">{error}</p>}<div className="flex gap-2"><Button size="sm" onClick={save} disabled={isPending}>Lưu</Button><button type="button" onClick={() => setEditing(false)} className="text-xs underline">Huỷ</button></div></div> : <p className="mt-2 text-sm text-foreground">{question.question}</p>}
      {isOwner && !editing && <div className="mt-2 flex gap-3"><button type="button" onClick={() => setEditing(true)} className="text-xs text-muted-foreground underline">Chỉnh sửa</button><button type="button" onClick={remove} disabled={isPending} className="text-xs text-destructive underline">Xoá</button></div>}{error && !editing && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
    <div><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">NEXUS</p>{question.answer ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.answer}</p> : <p className="mt-2 text-sm italic text-muted-foreground">{isOwner ? "Đang chờ NEXUS phản hồi..." : "Chưa có phản hồi."}</p>}</div>
  </article>;
}
