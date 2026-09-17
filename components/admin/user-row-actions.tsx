"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suspendUserAction,
  unsuspendUserAction,
  setUserRoleAction,
} from "@/app/(admin)/admin/users/actions";

export function UserRowActions({
  userId,
  status,
  role,
}: {
  userId: string;
  status: "ACTIVE" | "SUSPENDED";
  role: "CUSTOMER" | "ADMIN";
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("7");
  const [isPending, startTransition] = useTransition();

  function handleSuspend() {
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do.");
      return;
    }
    startTransition(async () => {
      const res = await suspendUserAction(
        userId,
        reason,
        duration === "0" ? null : Number(duration),
      );
      if (!res.ok) alert(res.error);
      setShowForm(false);
      setReason("");
      router.refresh();
    });
  }

  function handleUnsuspend() {
    if (!confirm("Mở khoá tài khoản này?")) return;
    startTransition(async () => {
      const res = await unsuspendUserAction(userId);
      if (!res.ok) alert(res.error);
      router.refresh();
    });
  }

  function handleToggleRole() {
    const nextRole = role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    if (!confirm(`Đổi vai trò thành ${nextRole}?`)) return;
    startTransition(async () => {
      const res = await setUserRoleAction(userId, nextRole);
      if (!res.ok) alert(res.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleToggleRole}
          disabled={isPending}
          className="border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground disabled:opacity-40"
        >
          {role === "ADMIN" ? "Bỏ quyền admin" : "Cấp quyền admin"}
        </button>
        {status === "SUSPENDED" ? (
          <button
            type="button"
            onClick={handleUnsuspend}
            disabled={isPending}
            className="border border-emerald-400/40 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-emerald-300 disabled:opacity-40"
          >
            Mở khoá
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            disabled={isPending}
            className="border border-destructive/30 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-destructive disabled:opacity-40"
          >
            Khoá tài khoản
          </button>
        )}
      </div>

      {showForm && (
        <div className="flex flex-col gap-2 border border-border bg-foreground/[0.02] p-3">
          <input
            placeholder="Lý do khoá"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border border-border bg-background px-3 py-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border border-border bg-background px-3 py-2 text-[12px] text-foreground"
          >
            <option value="1">24 giờ</option>
            <option value="7">7 ngày</option>
            <option value="30">30 ngày</option>
            <option value="0">Vĩnh viễn</option>
          </select>
          <button
            type="button"
            onClick={handleSuspend}
            disabled={isPending}
            className="border border-destructive/30 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-destructive disabled:opacity-40"
          >
            Xác nhận khoá
          </button>
        </div>
      )}
    </div>
  );
}
