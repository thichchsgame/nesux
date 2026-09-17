"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { suspendUser, unsuspendUser, setUserRole } from "@/lib/users";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Không có quyền thực hiện thao tác này.");
  return session.user.id!;
}

export async function suspendUserAction(
  userId: string,
  reason: string,
  durationDays: number | null
): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();
    await suspendUser(userId, { reason, durationDays }, adminId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function unsuspendUserAction(userId: string): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();
    await unsuspendUser(userId, adminId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function setUserRoleAction(userId: string, role: "CUSTOMER" | "ADMIN"): Promise<ActionResult> {
  try {
    const actingUserId = await requireAdmin();
    await setUserRole(userId, role, actingUserId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}
