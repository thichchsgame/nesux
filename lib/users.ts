// lib/users.ts
import "server-only";
import { prisma } from "@/lib/prisma";

export async function listUsers(params?: { page?: number; pageSize?: number }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 30;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        suspendedUntil: true,
        suspensionReason: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return { users, total, page, pageSize };
}

/** Trạng thái hiệu lực thật — coi là ACTIVE nếu suspendedUntil đã qua, dù DB chưa kịp cập nhật. */
export function isEffectivelySuspended(user: { status: string; suspendedUntil: Date | null }): boolean {
  if (user.status !== "SUSPENDED") return false;
  if (user.suspendedUntil && user.suspendedUntil <= new Date()) return false; // đã hết hạn
  return true;
}

/**
 * Đọc user + tự "chữa" trạng thái nếu đã hết hạn suspend nhưng DB chưa cập nhật —
 * gọi hàm này ở mọi nơi cần trạng thái mới nhất (đặc biệt trong jwt callback của NextAuth),
 * không cần cron job riêng vì việc "hết hạn → ACTIVE" chỉ cần đúng vào lúc có request đi qua.
 */
export async function syncSuspensionStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.status === "SUSPENDED" && user.suspendedUntil && user.suspendedUntil <= new Date()) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", suspendedUntil: null, suspensionReason: null },
    });
  }
  return user;
}

export async function suspendUser(
  userId: string,
  data: { reason: string; durationDays: number | null }, // null = vĩnh viễn
  adminId: string
) {
  if (userId === adminId) throw new Error("Không thể tự khoá tài khoản của chính mình.");

  const expiresAt = data.durationDays ? new Date(Date.now() + data.durationDays * 86400_000) : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED", suspendedUntil: expiresAt, suspensionReason: data.reason },
    }),
    prisma.accountAction.create({
      data: { userId, adminId, action: "SUSPEND", reason: data.reason, expiresAt },
    }),
  ]);
}

export async function unsuspendUser(userId: string, adminId: string) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", suspendedUntil: null, suspensionReason: null },
    }),
    prisma.accountAction.create({
      data: { userId, adminId, action: "UNSUSPEND" },
    }),
  ]);
}

export async function setUserRole(userId: string, role: "CUSTOMER" | "ADMIN", actingUserId: string) {
  if (userId === actingUserId && role !== "ADMIN") {
    throw new Error("Không thể tự bỏ quyền admin của chính mình.");
  }
  return prisma.user.update({ where: { id: userId }, data: { role } });
}