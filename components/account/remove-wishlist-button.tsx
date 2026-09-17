"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeFromWishlistAction } from "@/app/(storefront)/account/wishlist/actions";

export function RemoveWishlistButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await removeFromWishlistAction(productId);
      window.location.reload();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Xoá khỏi wishlist"
      className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
