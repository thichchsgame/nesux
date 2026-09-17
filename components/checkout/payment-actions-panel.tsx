"use client";

import { useState, useTransition } from "react";
import {
  retryPaymentAction,
  changePaymentMethodAction,
  cancelMyOrderAction,
} from "@/app/(storefront)/checkout/order-actions";

const methodLabel: Record<string, string> = {
  STRIPE: "Thẻ quốc tế (Visa/Mastercard)",
  VNPAY: "VNPay",
  COD: "Thanh toán khi nhận hàng (COD)",
};

export function PaymentActionsPanel({
  orderNumber,
  currentProvider,
}: {
  orderNumber: string;
  currentProvider: "STRIPE" | "VNPAY" | "COD";
}) {
  const [mode, setMode] = useState<"idle" | "changing">("idle");
  const [selected, setSelected] = useState<"STRIPE" | "VNPAY" | "COD">(
    currentProvider,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    setError(null);
    startTransition(async () => {
      const res = await retryPaymentAction(orderNumber);
      if (!res.ok) return setError(res.error);
      window.location.href = res.redirectUrl;
    });
  }

  function handleConfirmChange() {
    setError(null);
    startTransition(async () => {
      const res = await changePaymentMethodAction(orderNumber, selected);
      if (!res.ok) return setError(res.error);
      window.location.href = res.redirectUrl;
    });
  }

  function handleCancel() {
    if (!confirm("Huỷ đơn hàng này?")) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelMyOrderAction(orderNumber);
      if (!res.ok) return setError(res.error);
      window.location.reload();
    });
  }

  if (mode === "changing") {
    return (
      <div className="space-y-3 border-t border-border pt-5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Chọn phương thức mới
        </p>
        {(["STRIPE", "VNPAY", "COD"] as const).map((m) => (
          <label
            key={m}
            className={`flex cursor-pointer items-center gap-3 border p-3 text-sm ${
              selected === m ? "border-foreground" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="payment-method"
              checked={selected === m}
              onChange={() => setSelected(m)}
              className="accent-foreground"
            />
            {methodLabel[m]}
          </label>
        ))}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirmChange}
            disabled={isPending}
            className="border border-primary bg-primary px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Đang xử lý..." : "Xác nhận"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("idle");
              setError(null);
            }}
            className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          >
            Huỷ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border pt-5">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isPending}
          className="border border-primary bg-primary px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Đang chuyển hướng..." : "Thanh toán lại"}
        </button>
        <button
          type="button"
          onClick={() => setMode("changing")}
          className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-foreground hover:border-foreground/40"
        >
          Đổi phương thức
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="border border-destructive/30 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-destructive disabled:opacity-50"
        >
          Huỷ đơn
        </button>
      </div>
    </div>
  );
}
