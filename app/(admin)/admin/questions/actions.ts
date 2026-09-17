"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { answerQuestion, removeAnswer, setQuestionStatus } from "@/lib/questions";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Không có quyền thực hiện thao tác này.");
  return session.user.id;
}

function revalidateQuestionPaths(slug: string) {
  revalidatePath("/admin/questions");
  revalidatePath(`/products/${slug}`);
}

export async function setQuestionStatusAction(id: string, status: "PUBLISHED" | "HIDDEN"): Promise<ActionResult> {
  try {
    await requireAdmin();
    const question = await setQuestionStatus(id, status);
    revalidateQuestionPaths(question.product.slug);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}

export async function answerQuestionAction(id: string, answer: string): Promise<ActionResult> {
  try {
    const question = await answerQuestion(id, await requireAdmin(), answer);
    revalidateQuestionPaths(question.product.slug);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}

export async function removeAnswerAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const question = await removeAnswer(id);
    revalidateQuestionPaths(question.product.slug);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}
