"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { removeFromWishlist } from "@/lib/wishlist";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function removeFromWishlistAction(productId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Chưa đăng nhập." };
  try {
    await removeFromWishlist(session.user.id, productId);
    revalidatePath("/account/wishlist");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}
