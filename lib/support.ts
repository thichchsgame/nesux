import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import type {
  SupportTicketTopic,
  SupportTicketStatus,
  SupportTicketPriority,
} from "@/app/generated/prisma/enums";

export const supportTopicLabel: Record<SupportTicketTopic, string> = {
  GENERAL: "Hỗ trợ chung",
  ORDER: "Đơn hàng",
  PAYMENT: "Thanh toán",
  ACCOUNT: "Tài khoản",
};

type Identity = { userId?: string; guestEmail?: string };

function normalizeIdentity(identity: Identity): Identity {
  return {
    userId: identity.userId,
    guestEmail: identity.guestEmail?.trim().toLowerCase() || undefined,
  };
}

function assertIdentity(identity: Identity) {
  if (!identity.userId && !identity.guestEmail) {
    throw new Error("Cần đăng nhập hoặc cung cấp email để tạo yêu cầu hỗ trợ.");
  }
}

async function assertTicketOwnership(ticketId: string, rawIdentity: Identity) {
  const identity = normalizeIdentity(rawIdentity);
  const ticket = await prisma.supportTicket.findUniqueOrThrow({
    where: { id: ticketId },
  });
  const ownsAsUser = identity.userId && ticket.userId === identity.userId;
  const ownsAsGuest =
    !ticket.userId &&
    identity.guestEmail &&
    ticket.guestEmail === identity.guestEmail;
  if (!ownsAsUser && !ownsAsGuest) {
    throw new Error("Không có quyền xem yêu cầu hỗ trợ này.");
  }
  return ticket;
}

export async function createSupportTicket(
  rawIdentity: Identity,
  data: { topic: SupportTicketTopic; message: string },
) {
  const identity = normalizeIdentity(rawIdentity);
  assertIdentity(identity);
  if (!data.message.trim())
    throw new Error("Vui lòng nhập nội dung cần hỗ trợ.");

  // Mỗi khách chỉ có 1 ticket OPEN tại một thời điểm — kiểm tra trước (fast path)
  // để tránh tạo trùng khi khách bấm gửi 2 lần hoặc AI/chat gọi API 2 lần gần nhau.
  // Chỉ tính ticket đang OPEN — ticket RESOLVED cũ không chặn tạo ticket mới, vì
  // khách có nút "Bắt đầu yêu cầu mới" ở widget để chủ động rời ticket cũ.
  const existing = identity.userId
    ? await prisma.supportTicket.findFirst({
        where: { userId: identity.userId, status: "OPEN" },
      })
    : await prisma.supportTicket.findFirst({
        where: {
          guestEmail: identity.guestEmail,
          userId: null,
          status: "OPEN",
        },
      });

  if (existing) {
    await addCustomerMessage(existing.id, identity, data.message);
    return prisma.supportTicket.findUniqueOrThrow({
      where: { id: existing.id },
      include: { messages: true },
    });
  }

  try {
    return await prisma.supportTicket.create({
      data: {
        userId: identity.userId,
        guestEmail: identity.userId ? null : identity.guestEmail,
        topic: data.topic,
        lastMessageFrom: "CUSTOMER",
        messages: {
          create: {
            senderRole: "CUSTOMER",
            senderUserId: identity.userId,
            body: data.message.trim(),
          },
        },
      },
      include: { messages: true },
    });
  } catch (e) {
    // P2002 ở đây gần như chắc chắn đến từ 1 trong 2 partial unique index OPEN
    // (bảng chỉ có đúng 2 unique index kiểu này) — coi request thứ 2 là "nhắn thêm
    // vào ticket vừa được tạo bởi request kia" thay vì để lỗi văng ra cho khách.
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const raceTicket = identity.userId
        ? await prisma.supportTicket.findFirstOrThrow({
            where: { userId: identity.userId, status: "OPEN" },
          })
        : await prisma.supportTicket.findFirstOrThrow({
            where: {
              guestEmail: identity.guestEmail,
              userId: null,
              status: "OPEN",
            },
          });
      await addCustomerMessage(raceTicket.id, identity, data.message);
      return prisma.supportTicket.findUniqueOrThrow({
        where: { id: raceTicket.id },
        include: { messages: true },
      });
    }
    throw e;
  }
}

export async function getTicketForCustomer(
  ticketId: string,
  identity: Identity,
) {
  await assertTicketOwnership(ticketId, identity);
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getMyActiveTicket(userId: string) {
  // KHÔNG lọc theo status: ticket RESOLVED vẫn phải hiện lại khi khách F5, để họ
  // thấy đúng hội thoại cũ (và có thể nhắn tiếp để tự mở lại) thay vì rơi vào màn
  // AI chat trống như đang gặp phải là 1 ticket mới. Khớp với hành vi guest qua
  // localStorage (không quan tâm status). Khách chủ động rời bằng nút "Bắt đầu
  // yêu cầu mới" ở widget, không phải bằng cách ẩn ticket cũ đi khi F5.
  return prisma.supportTicket.findFirst({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function addCustomerMessage(
  ticketId: string,
  rawIdentity: Identity,
  body: string,
) {
  if (!body.trim()) throw new Error("Vui lòng nhập nội dung.");
  const identity = normalizeIdentity(rawIdentity);
  const ticket = await assertTicketOwnership(ticketId, identity);

  return prisma.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: {
        ticketId,
        senderRole: "CUSTOMER",
        senderUserId: identity.userId,
        body: body.trim(),
      },
    });
    // Khách nhắn lại sau khi ticket đã Resolved → tự mở lại.
    return tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: new Date(),
        lastMessageFrom: "CUSTOMER",
        status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status,
      },
    });
  });
}

export async function addAdminMessage(
  ticketId: string,
  adminUserId: string,
  body: string,
) {
  if (!body.trim()) throw new Error("Vui lòng nhập nội dung.");
  return prisma.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: {
        ticketId,
        senderRole: "ADMIN",
        senderUserId: adminUserId,
        body: body.trim(),
      },
    });
    return tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: new Date(),
        lastMessageFrom: "ADMIN",
        adminReadAt: new Date(),
      },
    });
  });
}

export async function updateTicketMeta(
  ticketId: string,
  data: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignedAdminId?: string | null;
  },
) {
  return prisma.supportTicket.update({ where: { id: ticketId }, data });
}

export async function listTicketsForAdmin() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      assignedAdmin: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return tickets.map((t) => ({
    ...t,
    unread:
      t.lastMessageFrom === "CUSTOMER" &&
      (!t.adminReadAt || t.adminReadAt < t.lastMessageAt),
  }));
}

export async function getTicketForAdmin(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { name: true, email: true } },
      assignedAdmin: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (ticket)
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { adminReadAt: new Date() },
    });
  return ticket;
}

export async function listAdminsForAssignment() {
  return prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function getSupportStats() {
  const tickets = await prisma.supportTicket.findMany({
    select: {
      status: true,
      priority: true,
      lastMessageFrom: true,
      lastMessageAt: true,
      adminReadAt: true,
      updatedAt: true,
    },
  });
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return {
    open: tickets.filter((t) => t.status === "OPEN").length,
    unread: tickets.filter(
      (t) =>
        t.lastMessageFrom === "CUSTOMER" &&
        (!t.adminReadAt || t.adminReadAt < t.lastMessageAt),
    ).length,
    highPriorityOpen: tickets.filter(
      (t) => t.status === "OPEN" && t.priority === "HIGH",
    ).length,
    resolvedToday: tickets.filter(
      (t) => t.status === "RESOLVED" && t.updatedAt >= startOfToday,
    ).length,
  };
}
