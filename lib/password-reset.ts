import "server-only";
import crypto from "crypto";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createPasswordResetToken(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) } }),
  ]);

  return rawToken;
}

type VerifyResult = { valid: true; userId: string } | { valid: false; reason: "not_found" | "expired" | "used" };

export async function verifyPasswordResetToken(rawToken: string): Promise<VerifyResult> {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!record) return { valid: false, reason: "not_found" };
  if (record.usedAt) return { valid: false, reason: "used" };
  if (record.expiresAt < new Date()) return { valid: false, reason: "expired" };
  return { valid: true, userId: record.userId };
}

export async function consumePasswordResetToken(rawToken: string, db: typeof prisma | Prisma.TransactionClient = prisma) {
  return db.passwordResetToken.updateMany({
    where: { tokenHash: hashToken(rawToken), usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
}
