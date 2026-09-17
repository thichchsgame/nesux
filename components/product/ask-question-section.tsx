"use client";

import { useState } from "react";
import Link from "next/link";
import { QuestionForm } from "@/components/product/question-form";

type AskQuestionSectionProps = {
  productId: string;
  productSlug: string;
  isLoggedIn: boolean;
};

export function AskQuestionSection({ productId, productSlug, isLoggedIn }: AskQuestionSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Product community</p>
          <h2 className="font-hand text-2xl font-bold uppercase tracking-tight text-foreground md:text-3xl">Hỏi &amp; đáp</h2>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="self-start shrink-0 border border-border px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Đặt câu hỏi
          </button>
        )}
      </div>

      {open && (
        <div className="mt-6 max-w-2xl">
          {isLoggedIn ? (
            <QuestionForm productId={productId} productSlug={productSlug} />
          ) : (
            <p className="text-sm text-muted-foreground"><Link href="/sign-in" className="underline">Đăng nhập</Link> để đặt câu hỏi.</p>
          )}
        </div>
      )}
    </div>
  );
}
