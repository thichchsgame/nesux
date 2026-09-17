import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/admin");
  }
  if (session.user.suspended) {
    redirect("/account-suspended");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <AdminSidebar />
      <main className="flex-1 md:h-screen md:overflow-y-auto">
        <div className="w-full px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
