"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";

type ActionResult = { ok: true } | { ok: false; error: string };

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerAction(formData: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const email = formData.email.trim().toLowerCase();
  const name = formData.name.trim();

  if (!name) return { ok: false, error: "Vui lòng nhập họ tên." };
  if (!validateEmail(email)) return { ok: false, error: "Email không hợp lệ." };
  if (formData.password.length < 8) {
    return { ok: false, error: "Mật khẩu phải có ít nhất 8 ký tự." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email này đã được đăng ký. Vui lòng đăng nhập." };
  }

  const passwordHash = await bcrypt.hash(formData.password, 10);

  await prisma.user.create({
    data: { name, email, password: passwordHash },
  });

  try {
    await signIn("credentials", { email, password: formData.password, redirect: false });
  } catch {
    return { ok: true };
  }

  return { ok: true };
}
