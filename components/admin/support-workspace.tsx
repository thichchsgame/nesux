"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Send, UserRound } from "lucide-react";
import { Panel, StatCard, StatusPill } from "@/components/admin/ui";
import {
  replyToTicketAction,
  updateTicketStatusAction,
  updateTicketPriorityAction,
  assignTicketAction,
  getTicketDetailAction,
} from "@/app/(admin)/admin/support/actions";

type TicketRow = {
  id: string;
  topic: string;
  topicLabel: string;
  status: "OPEN" | "RESOLVED";
  priority: "NORMAL" | "HIGH";
  unread: boolean;
  lastMessageAt: string;
  customerName: string;
  customerEmail: string;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  preview: string;
};
type Message = {
  id: string;
  senderRole: "CUSTOMER" | "ADMIN";
  body: string;
  createdAt: string;
};
type Admin = { id: string; name: string | null; email: string };

type SupportStats = {
  open: number;
  unread: number;
  highPriorityOpen: number;
  resolvedToday: number;
};

export function SupportWorkspace({
  tickets,
  admins,
  stats,
}: {
  tickets: TicketRow[];
  admins: Admin[];
  stats: SupportStats;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(tickets[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "open" | "resolved" | "unread">(
    "all",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const filtered = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesQuery =
          `${ticket.customerName} ${ticket.customerEmail} ${ticket.preview}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesView =
          view === "all" ||
          (view === "unread"
            ? ticket.unread
            : view === "open"
              ? ticket.status === "OPEN"
              : ticket.status === "RESOLVED");
        return matchesQuery && matchesView;
      }),
    [tickets, query, view],
  );

  async function loadDetail(id: string) {
    const ticket = await getTicketDetailAction(id);
    if (ticket)
      setMessages(
        ticket.messages.map((message) => ({
          id: message.id,
          senderRole: message.senderRole,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
        })),
      );
  }

  useEffect(() => {
    if (!selectedId) return;
    const initialLoad = setTimeout(() => void loadDetail(selectedId), 0);
    pollRef.current = setInterval(() => void loadDetail(selectedId), 8000);
    return () => {
      clearTimeout(initialLoad);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedId]);

  function handleReply() {
    if (!selected || !reply.trim()) return;
    const body = reply.trim();
    setReply("");
    startTransition(async () => {
      const result = await replyToTicketAction(selected.id, body);
      if (result.ok) {
        await loadDetail(selected.id);
        router.refresh();
      }
    });
  }
  function handleStatusToggle() {
    if (!selected) return;
    startTransition(async () => {
      await updateTicketStatusAction(
        selected.id,
        selected.status === "RESOLVED" ? "OPEN" : "RESOLVED",
      );
      router.refresh();
    });
  }
  function handlePriorityChange(priority: "NORMAL" | "HIGH") {
    if (!selected) return;
    startTransition(async () => {
      await updateTicketPriorityAction(selected.id, priority);
      router.refresh();
    });
  }
  function handleAssign(adminId: string) {
    if (!selected) return;
    startTransition(async () => {
      await assignTicketAction(selected.id, adminId || null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index="01" label="Đang mở" value={String(stats.open)} />
        <StatCard
          index="02"
          label="Chưa đọc"
          value={String(stats.unread).padStart(2, "0")}
        />
        <StatCard
          index="03"
          label="Ưu tiên cao"
          value={String(stats.highPriorityOpen).padStart(2, "0")}
        />
        <StatCard
          index="04"
          label="Đã xử lý hôm nay"
          value={String(stats.resolvedToday).padStart(2, "0")}
        />
      </div>
      <Panel className="overflow-hidden">
        <div className="grid min-h-[620px] md:grid-cols-[310px_1fr_230px]">
          <aside className="border-b border-border md:border-b-0 md:border-r">
            <div className="border-b border-border p-3">
              <label className="flex items-center gap-2 border border-border px-3">
                <Search className="size-4 text-muted-foreground" />
                <input
                  aria-label="Tìm hội thoại"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm khách hàng, nội dung..."
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </label>
              <div className="mt-3 flex gap-1 overflow-x-auto">
                {(["all", "open", "unread", "resolved"] as const).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setView(value)}
                      className={`whitespace-nowrap px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${view === value ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                    >
                      {
                        {
                          all: "Tất cả",
                          open: "Đang mở",
                          unread: "Chưa đọc",
                          resolved: "Đã xử lý",
                        }[value]
                      }
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`block w-full p-4 text-left transition-colors hover:bg-foreground/[0.04] ${selectedId === ticket.id ? "bg-foreground/[0.06]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12px] text-foreground">
                      {ticket.customerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {new Date(ticket.lastMessageAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {ticket.topicLabel}
                    </p>
                    {ticket.priority === "HIGH" && (
                      <span className="text-[9px] uppercase text-amber-300">
                        Ưu tiên
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-[11px] text-muted-foreground/70">
                    {ticket.preview}
                  </p>
                  {ticket.unread && (
                    <StatusPill className="mt-3 border-emerald-300/30 text-emerald-300">
                      Chưa đọc
                    </StatusPill>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-6 text-center text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
                  Không có hội thoại nào.
                </div>
              )}
            </div>
          </aside>
          {selected ? (
            <>
              <section className="flex min-h-[620px] flex-col">
                <header className="flex items-center justify-between border-b border-border p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center border border-border text-muted-foreground">
                      <UserRound className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-[13px] text-foreground">
                        {selected.customerName}
                      </h2>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {selected.customerEmail} · {selected.topicLabel}
                      </p>
                    </div>
                  </div>
                  <StatusPill
                    className={
                      selected.status === "OPEN"
                        ? "border-emerald-300/30 text-emerald-300"
                        : "border-border text-muted-foreground"
                    }
                  >
                    {selected.status === "OPEN" ? "Đang mở" : "Đã xử lý"}
                  </StatusPill>
                </header>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[78%] border p-4 text-[12px] leading-relaxed ${message.senderRole === "ADMIN" ? "self-end border-border bg-foreground/[0.06] text-foreground" : "border-border text-muted-foreground"}`}
                    >
                      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                        {message.senderRole === "ADMIN"
                          ? "Admin"
                          : "Khách hàng"}{" "}
                        ·{" "}
                        {new Date(message.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {message.body}
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-4">
                  <div className="flex gap-3">
                    <textarea
                      aria-label="Trả lời khách"
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Viết câu trả lời cho khách..."
                      className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                    <button
                      aria-label="Gửi trả lời"
                      onClick={handleReply}
                      disabled={isPending}
                      className="self-end bg-primary p-3 text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              </section>
              <aside className="border-t border-border p-5 md:border-l md:border-t-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  Thông tin
                </p>
                <div className="mt-5 space-y-5 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Khách hàng</p>
                    <p className="mt-2 text-foreground">
                      {selected.customerName}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {selected.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Chủ đề</p>
                    <p className="mt-2 text-foreground">
                      {selected.topicLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phụ trách</p>
                    <select
                      value={selected.assignedAdminId ?? ""}
                      onChange={(event) => handleAssign(event.target.value)}
                      className="mt-2 w-full border border-border bg-background px-2 py-2 text-[11px] text-foreground"
                    >
                      <option value="">Chưa phân công</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name ?? admin.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ưu tiên</p>
                    <select
                      value={selected.priority}
                      onChange={(event) =>
                        handlePriorityChange(
                          event.target.value as "NORMAL" | "HIGH",
                        )
                      }
                      className="mt-2 w-full border border-border bg-background px-2 py-2 text-[11px] text-foreground"
                    >
                      <option value="NORMAL">Bình thường</option>
                      <option value="HIGH">Cao</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 border border-border px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-foreground hover:bg-foreground/[0.05] disabled:opacity-40"
                  >
                    {selected.status === "RESOLVED"
                      ? "Mở lại"
                      : "Đánh dấu đã xử lý"}
                    {selected.status === "RESOLVED" ? null : (
                      <Check className="size-3" />
                    )}
                  </button>
                </div>
              </aside>
            </>
          ) : (
            <div className="col-span-2 flex items-center justify-center text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
              Chọn 1 hội thoại để xem
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
