"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  updateCartItemQuantityAction,
  removeCartItemAction,
} from "@/app/(storefront)/cart/actions";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function CartItemRow({
  itemId,
  productName,
  productSlug,
  size,
  color,
  image,
  stock,
  quantity: initialQuantity,
  unitPrice,
}: {
  itemId: string;
  productName: string;
  productSlug: string;
  size: string | null;
  color: string | null;
  image: string | null;
  stock: number;
  quantity: number;
  unitPrice: number;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeQuantity(next: number) {
    if (next < 1) return;
    const prev = quantity;
    setQuantity(next);
    setError(null);
    startTransition(async () => {
      const res = await updateCartItemQuantityAction(itemId, next);
      if (!res.ok) {
        setError(res.error);
        setQuantity(prev);
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeCartItemAction(itemId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex gap-5 py-6 first:pt-0">
      <div className="relative size-28 shrink-0 overflow-hidden bg-card md:size-36">
        {image ? (
          <Image
            src={image}
            alt={productName}
            fill
            sizes="144px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-4">
          <div>
            <Link
              href={`/products/${productSlug}`}
              className="font-hand text-lg uppercase text-foreground"
            >
              {productName}
            </Link>
            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {[color, size].filter(Boolean).join(" / ")}
            </p>
            {error ? (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            ) : null}
          </div>
          <p className="text-sm text-foreground">
            {fmt.format(unitPrice * quantity)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center border border-border">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => changeQuantity(quantity - 1)}
              disabled={isPending || quantity <= 1}
              className="flex size-8 items-center justify-center disabled:opacity-40"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-xs">{quantity}</span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => changeQuantity(quantity + 1)}
              disabled={isPending || quantity >= stock}
              className="flex size-8 items-center justify-center disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" /> Xoá
          </button>
        </div>
      </div>
    </div>
  );
}
