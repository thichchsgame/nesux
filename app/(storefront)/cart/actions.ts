"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as cart from "@/lib/cart";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function addToCartAction(
  variantId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await auth();
  try {
    await cart.addToCart(variantId, quantity, session?.user?.id);
    revalidatePath("/cart");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra.",
    };
  }
}

export async function updateCartItemQuantityAction(
  itemId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await auth();
  try {
    await cart.updateCartItemQuantity(itemId, quantity, session?.user?.id);
    revalidatePath("/cart");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra.",
    };
  }
}

export async function removeCartItemAction(
  itemId: string,
): Promise<ActionResult> {
  const session = await auth();
  try {
    await cart.removeCartItem(itemId, session?.user?.id);
    revalidatePath("/cart");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra.",
    };
  }
}
