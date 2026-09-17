"use server";

import bcrypt from "bcryptjs";
import { consumePasswordResetToken, verifyPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function resetPasswordAction(token: string, newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 8) return { ok: false, error: "Mật khẩu phải có ít nhất 8 ký tự." };
  const check = await verifyPasswordResetToken(token);
  if (!check.valid) {
    const messages = { not_found: "Link không hợp lệ.", expired: "Link đã hết hạn, vui lòng yêu cầu link mới.", used: "Link này đã được sử dụng." } as const;
    return { ok: false, error: messages[check.reason] };
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await consumePasswordResetToken(token, tx);
      if (consumed.count !== 1) throw new Error("RESET_TOKEN_UNAVAILABLE");
      await tx.user.update({ where: { id: check.userId }, data: { password: passwordHash } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RESET_TOKEN_UNAVAILABLE") return { ok: false, error: "Link đã hết hạn hoặc đã được sử dụng." };
    throw error;
  }
  return { ok: true };
}
