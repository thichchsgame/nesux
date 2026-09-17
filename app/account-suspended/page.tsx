import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function AccountSuspendedPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await (await import("@/lib/prisma")).prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
      <h1 className="font-hand text-2xl">Tài khoản hiện không thể đăng nhập</h1>
      <p className="text-sm text-muted-foreground">
        Vui lòng liên hệ bộ phận hỗ trợ nếu bạn cho rằng đây là nhầm lẫn.
      </p>
      {user?.suspensionReason && (
        <p className="text-xs text-muted-foreground font-mono">Lý do: {user.suspensionReason}</p>
      )}
      {user?.suspendedUntil && (
        <p className="text-xs text-muted-foreground font-mono">
          Có hiệu lực tới: {new Date(user.suspendedUntil).toLocaleDateString("vi-VN")}
        </p>
      )}
      <SignOutButton />
    </div>
  );
}
