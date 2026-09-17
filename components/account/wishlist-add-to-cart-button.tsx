"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "@/app/(storefront)/cart/actions";

export function WishlistAddToCartButton({ variantId }: { variantId: string }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const res = await addToCartAction(variantId, 1);
      if (!res.ok) {
        return;
      }
      setAdded(true);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || added}
      className="flex-1 border border-primary bg-primary px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-transparent hover:text-primary disabled:opacity-50"
    >
      {isPending ? "Đang thêm..." : added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
    </button>
  );
}
