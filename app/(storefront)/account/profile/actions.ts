"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult = { ok: true } | { ok: false; error: string };

function isValidPhone(phone: string): boolean {
  return /^(\+84|0)\d{9,10}$/.test(phone.replace(/[\s.-]/g, ""));
}

export async function updateProfileAction(params: { name: string; phone: string }): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập." };

  const name = params.name.trim();
  const phone = params.phone.trim();
  if (!name) return { ok: false, error: "Vui lòng nhập họ tên." };
  if (phone && !isValidPhone(phone)) {
    return { ok: false, error: "Số điện thoại không hợp lệ." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, phone: phone || null },
  });

  revalidatePath("/account/profile");
  return { ok: true };
}

export async function changePasswordAction(params: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Bạn cần đăng nhập." };

  const { currentPassword, newPassword, confirmNewPassword } = params;

  if (newPassword.length < 8) {
    return { ok: false, error: "Mật khẩu mới phải có ít nhất 8 ký tự." };
  }
  if (newPassword !== confirmNewPassword) {
    return { ok: false, error: "Mật khẩu xác nhận không khớp." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) return { ok: false, error: "Không tìm thấy tài khoản." };

  if (user.password) {
    if (!currentPassword) {
      return { ok: false, error: "Vui lòng nhập mật khẩu hiện tại." };
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return { ok: false, error: "Mật khẩu hiện tại không đúng." };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });

  revalidatePath("/account/profile");
  return { ok: true };
}
