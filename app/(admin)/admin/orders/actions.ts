"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateOrderStatus, cancelOrderAndRestoreStock } from "@/lib/orders";
import type { OrderStatus } from "@/app/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Không có quyền thực hiện thao tác này.");
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateOrderStatus(orderId, status);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await cancelOrderAndRestoreStock(orderId);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}
