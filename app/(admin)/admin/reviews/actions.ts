"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { setReviewStatus, replyToReview, removeReply } from "@/lib/reviews";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Không có quyền thực hiện thao tác này.");
  return session.user.id;
}

export async function setReviewStatusAction(
  reviewId: string,
  status: "PUBLISHED" | "HIDDEN"
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await setReviewStatus(reviewId, status);
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function replyToReviewAction(reviewId: string, reply: string): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();
    await replyToReview(reviewId, adminId, reply);
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function removeReplyAction(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await removeReply(reviewId);
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}
