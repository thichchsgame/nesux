import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      password: true,
      lastLoginAt: true,
    },
  });
  if (!user) redirect("/sign-in");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <ProfileForm
        initialName={user.name ?? ""}
        initialPhone={user.phone ?? ""}
        email={user.email}
      />

      <div className="border border-border p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="font-hand text-lg uppercase text-foreground">
              Bảo mật tài khoản
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user.password
                ? "Đăng nhập bằng email / mật khẩu"
                : "Đăng nhập qua Google"}
            </p>
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-5">
          <ChangePasswordForm hasPassword={Boolean(user.password)} />
        </div>
        <div className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
          <p>Lần đăng nhập gần nhất</p>
          <p className="mt-2 text-foreground">
            {user.lastLoginAt
              ? new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(user.lastLoginAt)
              : "Chưa có dữ liệu"}
          </p>
        </div>
      </div>
    </div>
  );
}
