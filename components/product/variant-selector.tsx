"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Minus, Plus, Sparkles } from "lucide-react";
import { addToCartAction } from "@/app/(storefront)/cart/actions";
import { toggleWishlistAction } from "@/app/(storefront)/products/wishlist-actions";
import { TryOnOverlay } from "@/components/product/try-on-overlay";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stock: number;
  priceOverride: number | null;
};

function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + "₫";
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export function VariantSelector({
  variants,
  basePrice,
  compareAtPrice,
  productId,
  productSlug,
  productName,
  initialWishlisted = false,
}: {
  variants: Variant[];
  basePrice: number;
  compareAtPrice?: number | null;
  productId: string;
  productSlug: string;
  productName: string;
  initialWishlisted?: boolean;
}) {
  const router = useRouter();

  const sizes = useMemo(() => {
    const unique = Array.from(
      new Set(variants.map((v) => v.size).filter(Boolean)),
    ) as string[];
    return unique.sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a);
      const bi = SIZE_ORDER.indexOf(b);
      if (ai === -1 || bi === -1) return a.localeCompare(b);
      return ai - bi;
    });
  }, [variants]);

  const colorOptions = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const v of variants) {
      if (v.color && !map.has(v.color)) {
        map.set(v.color, v.colorHex);
      }
    }
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes[0] ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colorOptions[0]?.name ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isWishlistPending, startWishlistTransition] = useTransition();
  const [qty, setQty] = useState(1);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  const matchedVariant = variants.find(
    (v) =>
      (sizes.length === 0 || v.size === selectedSize) &&
      (colorOptions.length === 0 || v.color === selectedColor),
  );

  const displayPrice = matchedVariant?.priceOverride ?? basePrice;
  const outOfStock = !matchedVariant || matchedVariant.stock <= 0;

  function handleAddToCart() {
    if (!matchedVariant) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await addToCartAction(matchedVariant.id, qty);
      if (res.ok) {
        setFeedback({ type: "success", message: "Đã thêm vào giỏ hàng." });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  function handleToggleWishlist() {
    startWishlistTransition(async () => {
      const res = await toggleWishlistAction(
        productId,
        wishlisted,
        productSlug,
      );
      if (!res.ok) {
        if (res.requiresAuth) {
          router.push(`/sign-in?callbackUrl=/products/${productSlug}`);
          return;
        }
        setFeedback({ type: "error", message: res.error });
        return;
      }
      setWishlisted((prev) => !prev);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <p className="font-mono text-2xl font-bold text-accent">
          {formatVnd(displayPrice)}
        </p>
        {compareAtPrice && compareAtPrice > displayPrice && (
          <p className="font-mono text-sm line-through text-muted-foreground">
            {formatVnd(compareAtPrice)}
          </p>
        )}
      </div>

      {matchedVariant && !outOfStock && (
        <p className="font-mono text-xs text-muted-foreground">
          Tình trạng: còn {matchedVariant.stock} chiếc
        </p>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Size</p>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSelectedSize(s);
                  setFeedback(null);
                }}
                className={`min-w-12 border px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                  selectedSize === s
                    ? "border-foreground bg-foreground text-black"
                    : "border-border text-foreground hover:border-foreground/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colorOptions.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Màu</p>
          <div className="flex gap-3 flex-wrap items-center">
            {colorOptions.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                onClick={() => {
                  setSelectedColor(c.name);
                  setFeedback(null);
                }}
                style={{ background: c.hex ?? undefined }}
                className={`w-8 h-8 rounded-full border transition-all ${
                  selectedColor === c.name
                    ? "outline outline-2 outline-accent outline-offset-2 border-foreground"
                    : "border-border/60 hover:border-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center border border-border">
          <button
            type="button"
            aria-label="Giảm số lượng"
            onClick={() => setQty((value) => Math.max(1, value - 1))}
            className="flex h-12 w-12 items-center justify-center hover:bg-foreground/5"
          >
            <Minus className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            onClick={() => setQty((value) => Math.min(9, value + 1))}
            className="flex h-12 w-12 items-center justify-center hover:bg-foreground/5"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleAddToCart}
          className="group flex flex-1 items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3.5 font-medium text-black hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-foreground"
        >
          {outOfStock
            ? "Hết hàng"
            : isPending
              ? "Đang thêm..."
              : <><span>Thêm vào giỏ hàng</span><ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} /></>}
        </button>
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isWishlistPending}
          title={wishlisted ? "Xoá khỏi wishlist" : "Thêm vào wishlist"}
          className="flex h-12 w-[52px] shrink-0 items-center justify-center border border-foreground transition-colors hover:bg-foreground/10 disabled:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 stroke-foreground"
            style={{ fill: wishlisted ? "var(--accent)" : "none" }}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20 C 5 15, 3 10.5, 6 7 C 8.5 4.5, 12 6.5, 12 9 C 12 6.5, 15.5 4.5, 18 7 C 21 10.5, 19 15, 12 20 Z" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setTryOnOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 border border-border text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground/60 hover:bg-foreground/5"
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.5} /> Try-On 2D / 3D (Demo)
      </button>

      {outOfStock && (
        <p className="text-xs text-muted-foreground font-mono">
          Biến thể này hiện đã hết hàng.
        </p>
      )}

      {feedback && (
        <p
          className={`text-sm font-mono ${
            feedback.type === "success" ? "text-foreground" : "text-destructive"
          }`}
        >
          {feedback.message}{" "}
          {feedback.type === "success" && (
            <Link href="/cart" className="underline">
              Xem giỏ hàng →
            </Link>
          )}
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-dashed border-border p-4 flex items-center justify-between gap-4 z-40">
        <span className="font-mono font-bold">{formatVnd(displayPrice)}</span>
        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleAddToCart}
          className="flex-1 border border-foreground bg-foreground text-black px-6 py-3 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {outOfStock
            ? "Hết hàng"
            : isPending
              ? "Đang thêm..."
              : "Thêm vào giỏ hàng"}
        </button>
      </div>
      {tryOnOpen && (
        <TryOnOverlay
          productName={productName}
          onClose={() => setTryOnOpen(false)}
        />
      )}
    </div>
  );
}
