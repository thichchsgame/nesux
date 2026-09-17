"use server";

import { revalidatePath } from "next/cache";
import { createReview, deleteReview, updateReview } from "@/lib/reviews";
import { requireActiveUserId } from "@/lib/auth-guards";

type ActionResult = { ok: true } | { ok: false; error: string };
type ReviewInput = { rating: number; comment?: string };

export async function createReviewAction(productId: string, productSlug: string, orderItemId: string, data: ReviewInput, files?: File[]): Promise<ActionResult> {
  try {
    await createReview(await requireActiveUserId(), productId, orderItemId, data, files);
    revalidatePath(`/products/${productSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}

export async function updateReviewAction(reviewId: string, productSlug: string, data: ReviewInput, files?: File[]): Promise<ActionResult> {
  try {
    await updateReview(reviewId, await requireActiveUserId(), data, files);
    revalidatePath(`/products/${productSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}

export async function deleteReviewAction(reviewId: string, productSlug: string): Promise<ActionResult> {
  try {
    await deleteReview(reviewId, await requireActiveUserId());
    revalidatePath(`/products/${productSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra." };
  }
}
