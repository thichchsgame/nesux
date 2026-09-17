"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { retryPaymentAction } from "@/app/(storefront)/checkout/order-actions";

export function RetryPaymentButton({ orderNumber }: { orderNumber: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRetry() {
    setError(null);
    startTransition(async () => {
      const res = await retryPaymentAction(orderNumber);
      if (!res.ok) { setError(res.error); return; }
      window.location.href = res.redirectUrl;
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleRetry} disabled={isPending} className="w-full">
        {isPending ? "Đang chuyển hướng..." : "Thử lại thanh toán"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
