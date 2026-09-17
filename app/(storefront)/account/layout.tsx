import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountTabs } from "@/components/account/account-tabs";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  if (session.user.suspended) {
    redirect("/account-suspended");
  }

  const firstName = session.user.name?.trim().split(/\s+/)[0] || "bạn";

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-20">
      <div className="flex flex-col justify-between gap-8 border-b border-border pb-10 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Hệ thống cá nhân / Tài khoản
          </p>
          <h1 className="mt-3 font-hand text-5xl font-bold uppercase tracking-tight text-foreground">
            Chào, {firstName}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Quản lý đơn hàng, sản phẩm đã lưu, địa chỉ giao hàng và thông tin cá
            nhân.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2 bg-emerald-400" /> Đã xác thực
          </span>
          <SignOutButton />
        </div>
      </div>

      <AccountTabs />

      <div className="mt-10">{children}</div>
    </div>
  );
}
