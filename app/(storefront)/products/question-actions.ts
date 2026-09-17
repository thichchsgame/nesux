"use server";

import { revalidatePath } from "next/cache";
import { createQuestion, deleteQuestion, updateQuestion } from "@/lib/questions";
import { requireActiveUserId } from "@/lib/auth-guards";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createQuestionAction(productId: string, productSlug: string, question: string): Promise<ActionResult> {
  try {
    await createQuestion(await requireActiveUserId(), productId, question);
    revalidatePath(`/products/${productSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}

export async function updateQuestionAction(questionId: string, productSlug: string, question: string): Promise<ActionResult> {
  try {
    await updateQuestion(questionId, await requireActiveUserId(), question);
    revalidatePath(`/products/${productSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}

export async function deleteQuestionAction(questionId: string, productSlug: string): Promise<ActionResult> {
  try {
    await deleteQuestion(questionId, await requireActiveUserId());
    revalidatePath(`/products/${productSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}
