"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Panel, StatCard, StatusPill } from "@/components/admin/ui";
import { UserRowActions } from "@/components/admin/user-row-actions";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  suspendedUntil: string | null;
  suspensionReason: string | null;
  createdAt: string;
  orderCount: number;
};

const PAGE_SIZE = 8;

export function UsersWorkspace({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Tất cả vai trò");
  const [status, setStatus] = useState("Tất cả trạng thái");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UserRow | null>(null);

  const active = users.filter((u) => u.status === "ACTIVE").length;
  const admins = users.filter((u) => u.role === "ADMIN").length;

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const haystack = `${u.name ?? ""} ${u.email}`.toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesRole =
        role === "Tất cả vai trò" ||
        (role === "Admin" ? u.role === "ADMIN" : u.role === "CUSTOMER");
      const matchesStatus =
        status === "Tất cả trạng thái" ||
        (status === "Hoạt động"
          ? u.status === "ACTIVE"
          : u.status === "SUSPENDED");
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, role, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const initials = (name: string | null, email: string) =>
    (name?.trim() || email)
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          index="01"
          label="Tổng người dùng"
          value={String(users.length)}
        />
        <StatCard index="02" label="Đang hoạt động" value={String(active)} />
        <StatCard index="03" label="Quản trị viên" value={String(admins)} />
        <StatCard
          index="04"
          label="Đang bị khoá"
          value={String(users.length - active)}
        />
      </div>

      <Panel title="Tài khoản" meta={`${filtered.length} người dùng`}>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row">
          <label className="flex flex-1 items-center gap-2 border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên, email..."
              className="w-full bg-transparent py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-foreground"
          >
            <option>Tất cả vai trò</option>
            <option>Customer</option>
            <option>Admin</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-foreground"
          >
            <option>Tất cả trạng thái</option>
            <option>Hoạt động</option>
            <option>Đang khoá</option>
          </select>
        </div>

        <div className="hidden grid-cols-[1.6fr_0.8fr_0.7fr_0.9fr_0.7fr] gap-4 border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 md:grid">
          <span>Người dùng</span>
          <span>Vai trò</span>
          <span>Số đơn</span>
          <span>Trạng thái</span>
          <span className="text-right">Xem</span>
        </div>

        <div className="divide-y divide-border">
          {visible.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u)}
              className="grid w-full grid-cols-2 gap-4 px-5 py-4 text-left text-[13px] transition-colors hover:bg-foreground/[0.03] md:grid-cols-[1.6fr_0.8fr_0.7fr_0.9fr_0.7fr] md:items-center"
            >
              <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border font-hand text-[11px] text-foreground">
                  {initials(u.name, u.email)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-foreground">{u.name ?? "—"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {u.email}
                  </p>
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {u.role}
              </span>
              <span className="text-foreground">{u.orderCount}</span>
              <span>
                <StatusPill
                  className={
                    u.status === "SUSPENDED"
                      ? "border-red-400/40 text-red-300"
                      : "border-emerald-400/40 text-emerald-300"
                  }
                >
                  {u.status === "SUSPENDED" ? "Đang khoá" : "Hoạt động"}
                </StatusPill>
              </span>
              <span className="text-right text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Xem →
              </span>
            </button>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="px-5 py-12 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
            Không có người dùng khớp bộ lọc.
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              aria-label="Trang trước"
              disabled={page === 1}
              onClick={() => setPage((v) => Math.max(1, v - 1))}
              className="border border-border p-2 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Trang sau"
              disabled={page === totalPages}
              onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
              className="border border-border p-2 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Panel>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50"
          onClick={() => setSelected(null)}
        >
          <aside
            className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  User detail
                </p>
                <h2 className="mt-2 font-hand text-2xl uppercase text-foreground">
                  {selected.name ?? "Chưa đặt tên"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setSelected(null)}
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-8 space-y-5 text-xs">
              <div className="border border-border p-4">
                <p className="text-muted-foreground">Email</p>
                <p className="mt-2 text-foreground">{selected.email}</p>
                <p className="mt-4 text-muted-foreground">Tham gia</p>
                <p className="mt-2 text-foreground">
                  {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                </p>
                {selected.status === "SUSPENDED" && (
                  <>
                    <p className="mt-4 text-muted-foreground">Lý do khoá</p>
                    <p className="mt-2 text-foreground">
                      {selected.suspensionReason}
                    </p>
                    <p className="mt-4 text-muted-foreground">Khoá đến</p>
                    <p className="mt-2 text-foreground">
                      {selected.suspendedUntil
                        ? new Date(selected.suspendedUntil).toLocaleDateString(
                            "vi-VN",
                          )
                        : "Vĩnh viễn"}
                    </p>
                  </>
                )}
              </div>

              <div className="border border-border p-4">
                <p className="text-muted-foreground">Số đơn hàng</p>
                <p className="mt-2 font-hand text-2xl text-foreground">
                  {selected.orderCount}
                </p>
                <Link
                  href="/admin/orders"
                  className="mt-3 inline-block text-[10px] uppercase tracking-[0.15em] text-foreground underline underline-offset-4"
                >
                  Xem đơn hàng (lọc theo email ở trang Orders) →
                </Link>
              </div>

              <UserRowActions
                userId={selected.id}
                status={selected.status}
                role={selected.role}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
