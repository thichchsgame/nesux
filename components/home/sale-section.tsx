"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";

type SaleProduct = {
  slug: string;
  name: string;
  categoryName: string;
  basePrice: number;
  compareAtPrice: number;
  percentOff: number;
  image: string | null;
};
function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

// Decorative only until campaigns have a real end date in the catalogue.
function Countdown() {
  const [remaining, setRemaining] = useState(4 * 60 * 60 + 12 * 60 + 36);
  useEffect(() => {
    const timer = window.setInterval(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span>
      {String(Math.floor(remaining / 3600)).padStart(2, "0")}:
      {String(Math.floor((remaining % 3600) / 60)).padStart(2, "0")}:
      {String(remaining % 60).padStart(2, "0")}
    </span>
  );
}

export function SaleSection({ products }: { products: SaleProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section
      id="sale"
      className="mx-auto max-w-[1400px] scroll-mt-20 border-t border-border px-5 py-16 md:px-10 md:py-24"
    >
      <ScrollReveal>
      <div className="relative mb-10 overflow-hidden border border-border bg-card px-6 py-8 md:px-10 md:py-10">
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              NEXUS / PRIVATE REDUCTION
            </p>
            <h2 className="font-hand text-4xl font-bold uppercase tracking-[-0.06em] text-foreground md:text-7xl">
              Sale / Archive
            </h2>
            <p className="mt-4 max-w-md text-xs uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
              Last units. Same construction. Reduced for a limited window.
            </p>
          </div>
          <div className="flex items-end justify-between gap-8 border-t border-border pt-5 md:min-w-[330px] md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                Drop closes in
              </p>
              <p className="font-hand text-3xl tabular-nums tracking-[0.08em] text-foreground">
                <Countdown />
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-border px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Shop sale <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      </ScrollReveal>
      <div className="mb-6 flex items-end justify-between">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Selected pieces
        </p>
        <Link
          href="/products"
          className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground transition-opacity hover:opacity-60 md:inline-flex"
        >
          View all offers <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
        {products.map((product, index) => (
          <ScrollReveal key={product.slug} delay={index * 90} y={28}>
          <Link
            href={`/products/${product.slug}`}
            className="group block h-full bg-background p-3"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-card">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              )}
              <span className="absolute left-3 top-3 bg-background px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground">
                -{product.percentOff}%
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <h3 className="font-hand text-sm uppercase tracking-wide text-foreground">
                  {product.name}
                </h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {product.categoryName}
                </p>
              </div>
              <div className="font-hand text-right text-sm">
                <span className="text-foreground">
                  {formatVnd(product.basePrice)}
                </span>
                <span className="ml-2 text-muted-foreground line-through">
                  {formatVnd(product.compareAtPrice)}
                </span>
              </div>
            </div>
          </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
