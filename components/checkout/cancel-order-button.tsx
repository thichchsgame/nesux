"use client";

import { useState, useTransition } from "react";
import { cancelMyOrderAction } from "@/app/(storefront)/checkout/order-actions";

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (
      !confirm(
        "Huỷ đơn hàng này? Bạn cần đặt lại đơn mới nếu muốn đổi phương thức thanh toán.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await cancelMyOrderAction(orderNumber);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="text-xs text-destructive underline underline-offset-2 disabled:opacity-50"
      >
        {isPending ? "Đang huỷ..." : "Huỷ đơn"}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
