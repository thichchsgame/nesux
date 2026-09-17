"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createCoupon, updateCoupon, deleteCoupon } from "@/lib/coupons";

type ActionResult = { ok: true } | { ok: false; error: string };

type CouponFormInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
};

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Không có quyền thực hiện thao tác này.");
}

function toDate(v?: string | null) {
  return v ? new Date(v) : null;
}

export async function createCouponAction(data: CouponFormInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    await createCoupon({ ...data, startsAt: toDate(data.startsAt), expiresAt: toDate(data.expiresAt) });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function updateCouponAction(id: string, data: CouponFormInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateCoupon(id, { ...data, startsAt: toDate(data.startsAt), expiresAt: toDate(data.expiresAt) });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteCoupon(id);
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}
