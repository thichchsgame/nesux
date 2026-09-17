"use server";

import { auth } from "@/lib/auth";
import {
  createSupportTicket,
  addCustomerMessage,
  getTicketForCustomer,
  getMyActiveTicket,
} from "@/lib/support";
import { addVariantToCart, getCartSummary } from "@/lib/shopping";
import type { SupportTicketTopic } from "@/app/generated/prisma/enums";

export async function getSupportContextAction() {
  const session = await auth();
  if (!session?.user?.id) return { loggedIn: false as const };

  const activeTicket = await getMyActiveTicket(session.user.id);
  return {
    loggedIn: true as const,
    email: session.user.email ?? null,
    activeTicket: activeTicket
      ? {
          id: activeTicket.id,
          status: activeTicket.status,
          messages: activeTicket.messages.map((m) => ({
            id: m.id,
            senderRole: m.senderRole,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
          })),
        }
      : null,
  };
}

export async function createSupportTicketAction(input: {
  topic: SupportTicketTopic;
  message: string;
  guestEmail?: string;
}) {
  try {
    const session = await auth();
    const ticket = await createSupportTicket(
      {
        userId: session?.user?.id,
        guestEmail: session?.user?.id ? undefined : input.guestEmail,
      },
      { topic: input.topic, message: input.message },
    );
    return { ok: true as const, ticketId: ticket.id };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra.",
    };
  }
}

export async function sendCustomerMessageAction(input: {
  ticketId: string;
  body: string;
  guestEmail?: string;
}) {
  try {
    const session = await auth();
    await addCustomerMessage(
      input.ticketId,
      {
        userId: session?.user?.id,
        guestEmail: session?.user?.id ? undefined : input.guestEmail,
      },
      input.body,
    );
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra.",
    };
  }
}

export async function getTicketThreadAction(
  ticketId: string,
  guestEmail?: string,
) {
  try {
    const session = await auth();
    const ticket = await getTicketForCustomer(ticketId, {
      userId: session?.user?.id,
      guestEmail: session?.user?.id ? undefined : guestEmail,
    });
    if (!ticket) return { ok: false as const, error: "Không tìm thấy." };
    return {
      ok: true as const,
      status: ticket.status,
      messages: ticket.messages.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra.",
    };
  }
}

export async function addToCartAction(variantId: string, quantity: number) {
  const session = await auth();
  const result = await addVariantToCart(
    { userId: session?.user?.id },
    variantId,
    quantity,
  );
  return result;
}

export async function getCartSummaryAction() {
  const session = await auth();
  return getCartSummary({ userId: session?.user?.id });
}
