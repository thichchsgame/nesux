import { listUsers } from "@/lib/users";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { UsersWorkspace } from "@/components/admin/users-workspace";

export default async function AdminUsersPage() {
  const { users } = await listUsers({ pageSize: 1000 });

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    suspendedUntil: u.suspendedUntil?.toISOString() ?? null,
    suspensionReason: u.suspensionReason,
    createdAt: u.createdAt.toISOString(),
    orderCount: u._count.orders,
  }));

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Người dùng" crumb="Users" />
      <UsersWorkspace users={rows} />
    </div>
  );
}
