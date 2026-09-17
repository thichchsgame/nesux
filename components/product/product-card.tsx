"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice?: number | null;
  image: string | null;
  hoverImage?: string | null;
  colors?: { name: string; hex: string | null }[];
};

function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

export function ProductCard({
  slug,
  name,
  basePrice,
  compareAtPrice,
  image,
  hoverImage,
  colors,
}: Props) {
  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="relative aspect-4/5 w-full overflow-hidden bg-card">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover ${hoverImage ? "transition-opacity duration-500 group-hover:opacity-0" : ""}`}
          />
        )}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        {compareAtPrice && (
          <span className="absolute left-3 top-3 bg-background px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-hand text-sm font-medium uppercase tracking-wide text-foreground">
            {name}
          </h3>
          {colors && colors.length > 0 && (
            <div className="mt-1.5 flex gap-1.5">
              {colors.map((color) => (
                <span
                  key={color.name}
                  title={color.name}
                  className="h-3 w-3 rounded-full border border-foreground/50"
                  style={color.hex ? { backgroundColor: color.hex } : undefined}
                />
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          {compareAtPrice ? (
            <>
              <span className="block text-xs text-muted-foreground line-through">
                {formatVnd(compareAtPrice)}
              </span>
              <span className="font-hand text-sm text-foreground">
                {formatVnd(basePrice)}
              </span>
            </>
          ) : (
            <span className="font-hand text-sm text-foreground">
              {formatVnd(basePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
