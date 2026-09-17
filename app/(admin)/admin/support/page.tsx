import {
  listTicketsForAdmin,
  listAdminsForAssignment,
  getSupportStats,
  supportTopicLabel,
} from "@/lib/support";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { SupportWorkspace } from "@/components/admin/support-workspace";

export default async function AdminSupportPage() {
  const [tickets, admins, stats] = await Promise.all([
    listTicketsForAdmin(),
    listAdminsForAssignment(),
    getSupportStats(),
  ]);

  const rows = tickets.map((ticket) => ({
    id: ticket.id,
    topic: ticket.topic,
    topicLabel: supportTopicLabel[ticket.topic],
    status: ticket.status,
    priority: ticket.priority,
    unread: ticket.unread,
    lastMessageAt: ticket.lastMessageAt.toISOString(),
    customerName: ticket.user?.name ?? ticket.guestEmail ?? "Khách vãng lai",
    customerEmail: ticket.user?.email ?? ticket.guestEmail ?? "",
    assignedAdminId: ticket.assignedAdminId,
    assignedAdminName: ticket.assignedAdmin?.name ?? null,
    preview: ticket.messages[0]?.body ?? "",
  }));

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Hỗ trợ" crumb="Support" />
      <SupportWorkspace tickets={rows} admins={admins} stats={stats} />
    </div>
  );
}
