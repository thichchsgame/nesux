"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { addToWishlist, removeFromWishlist } from "@/lib/wishlist";

type ActionResult = { ok: true } | { ok: false; error: string; requiresAuth?: boolean };

export async function toggleWishlistAction(
  productId: string,
  currentlyIn: boolean,
  productSlug: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Vui lòng đăng nhập để lưu vào wishlist.", requiresAuth: true };
  }
  if (session.user.suspended) {
    return { ok: false, error: "Tài khoản của bạn hiện không thể thực hiện thao tác này." };
  }

  try {
    if (currentlyIn) {
      await removeFromWishlist(session.user.id, productId);
    } else {
      await addToWishlist(session.user.id, productId);
    }
    revalidatePath(`/products/${productSlug}`);
    revalidatePath("/account/wishlist");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}