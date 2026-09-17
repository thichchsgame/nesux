// app/checkout/coupon-actions.ts
"use server";

import { auth } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupons";

type ActionResult =
  | { ok: true; couponId: string; couponCode: string; discountAmount: number }
  | { ok: false; error: string };

export async function applyCouponAction(code: string, subtotal: number): Promise<ActionResult> {
  const session = await auth();
  const result = await validateCoupon(code, subtotal, session?.user?.id);
  return result;
}