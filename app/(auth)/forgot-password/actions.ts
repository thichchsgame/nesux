"use server";

import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export async function requestPasswordResetAction(emailRaw: string): Promise<{ ok: true }> {
  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail({ to: user.email, resetUrl: `${baseUrl}/reset-password?token=${token}` }).catch((error) => {
      console.error("requestPasswordResetAction: gửi email thất bại", error);
    });
  }

  return { ok: true };
}
