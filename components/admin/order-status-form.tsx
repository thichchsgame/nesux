"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/components/admin/ui";
import {
  updateOrderStatusAction,
  cancelOrderAction,
} from "@/app/(admin)/admin/orders/actions";
import {
  ALLOWED_STATUS_TRANSITIONS,
  orderStatusLabel as statusLabel,
} from "@/lib/order-status";
import type { OrderStatus } from "@/app/generated/prisma/enums";

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const nextOptions = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  const [status, setStatus] = useState<OrderStatus>(
    nextOptions[0] ?? currentStatus,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpdate() {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, status);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCancel() {
    if (!confirm("Huỷ đơn này và hoàn lại tồn kho?")) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelOrderAction(orderId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const canCancel = currentStatus === "PENDING";

  if (nextOptions.length === 0 && !canCancel) {
    return (
      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
        Đơn đã kết thúc vòng đời
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {nextOptions.length > 0 && (
          <>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="border border-border bg-background px-3 py-2 text-[12px] text-foreground outline-none"
            >
              {nextOptions.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
            <AdminButton onClick={handleUpdate}>
              {isPending ? "Đang lưu..." : "Cập nhật"}
            </AdminButton>
          </>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="border border-destructive/30 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-destructive disabled:opacity-50"
          >
            Huỷ đơn + hoàn kho
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
