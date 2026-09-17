"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addAdminMessage,
  updateTicketMeta,
  getTicketForAdmin,
} from "@/lib/support";
import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/app/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN")
    throw new Error("Không có quyền thực hiện thao tác này.");
  return session.user.id!;
}

export async function replyToTicketAction(
  ticketId: string,
  body: string,
): Promise<ActionResult> {
  try {
    const adminId = await requireAdmin();
    await addAdminMessage(ticketId, adminId, body);
    revalidatePath("/admin/support");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra.",
    };
  }
}

export async function updateTicketStatusAction(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateTicketMeta(ticketId, { status });
    revalidatePath("/admin/support");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra.",
    };
  }
}

export async function updateTicketPriorityAction(
  ticketId: string,
  priority: SupportTicketPriority,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateTicketMeta(ticketId, { priority });
    revalidatePath("/admin/support");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra.",
    };
  }
}

export async function assignTicketAction(
  ticketId: string,
  adminId: string | null,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateTicketMeta(ticketId, { assignedAdminId: adminId });
    revalidatePath("/admin/support");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra.",
    };
  }
}

export async function getTicketDetailAction(ticketId: string) {
  await requireAdmin();
  return getTicketForAdmin(ticketId);
}
