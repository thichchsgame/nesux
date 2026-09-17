"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";

type HeroProduct = {
  slug: string;
  name: string;
  categoryName: string;
  basePrice: number;
  image: string | null;
  heroTagline: string;
};
type Slide = { kind: "brand" } | { kind: "product"; product: HeroProduct };

function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + "₫";
}

export function HeroSystem({ products }: { products: HeroProduct[] }) {
  const slides: Slide[] = [
    { kind: "brand" },
    ...products.map((product) => ({ kind: "product" as const, product })),
  ];
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-16 pt-10 md:px-10 md:pb-24 md:pt-16">
      <ScrollReveal y={16} duration={500}>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>System / {String(activeSlide + 1).padStart(2, "0")}</span>
        <span>FW—26</span>
      </div>
      </ScrollReveal>

      <div className="relative mt-6">
        <Link
          href={
            slide.kind === "brand"
              ? "/products"
              : `/products/${slide.product.slug}`
          }
          className="group relative block overflow-hidden bg-card"
        >
          {slide.kind === "brand" ? (
            <div className="brand-banner relative flex aspect-[16/12] w-full items-center justify-center overflow-hidden bg-card md:aspect-[16/9]">
              <div
                className="brand-banner-grid absolute inset-0 opacity-50"
                aria-hidden="true"
              />
              <div className="relative z-10 overflow-hidden px-5 text-center">
                <span className="brand-wordmark font-hand block text-[clamp(4rem,15vw,13rem)] font-bold uppercase leading-none tracking-[-0.1em] text-foreground">
                  NEXUS
                </span>
                <span className="mt-5 block text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
                  Form / Function / Future
                </span>
              </div>
              <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 border-b border-muted-foreground/60 pb-1 text-[10px] uppercase tracking-[0.2em] text-foreground md:bottom-7 md:right-7">
                Explore the system{" "}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </span>
            </div>
          ) : (
            // KHUNG ẢNH SẢN PHẨM: dùng nền sáng/chữ tối có chủ đích — giống quy ước studio
            // chụp sản phẩm, tương phản với slide thương hiệu nền tối. KHÔNG dùng token
            // bg-card/text-foreground ở đây, đúng ý đồ gốc của theme.
            <div className="relative aspect-[16/12] w-full overflow-hidden bg-[var(--hero-product-bg)] text-[var(--hero-product-fg)] md:aspect-[16/9]">
              <div className="absolute left-5 top-5 z-10 max-w-[290px] md:left-8 md:top-8">
                <p className="font-hand text-[clamp(3.25rem,7vw,7.5rem)] font-bold uppercase leading-[0.82] tracking-[-0.08em]">
                  {slide.product.name.split(" ").map((word) => (
                    <span key={word} className="block">
                      {word}
                    </span>
                  ))}
                </p>
                <p className="mt-7 max-w-[220px] text-[10px] font-semibold uppercase leading-[1.45] tracking-[0.08em]">
                  NEXUS làm quần áo cho chuyển động, thời tiết và nhịp sống đô
                  thị.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-current px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Shop drop{" "}
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
              </div>
              {slide.product.image && (
                <Image
                  key={slide.product.image}
                  src={slide.product.image}
                  alt={slide.product.name}
                  fill
                  priority={activeSlide === 1}
                  sizes="(max-width: 1400px) 100vw, 1400px"
                  className="hero-slide-image object-contain object-[68%_center] md:object-[70%_center]"
                />
              )}
              <div className="absolute right-5 top-5 z-10 text-right text-[9px] font-semibold uppercase tracking-[0.16em] md:right-8 md:top-8">
                DROP 08 // INCOMING
                <br />
                <span className="font-normal opacity-60">
                  {slide.product.heroTagline}
                </span>
              </div>
            </div>
          )}
        </Link>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/75 px-3 py-2 backdrop-blur md:bottom-7">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Xem slide ${index + 1}`}
              onClick={() => setActiveSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                activeSlide === index
                  ? "w-8 bg-foreground"
                  : "w-1.5 bg-foreground/35 hover:bg-foreground/70"
              }`}
            />
          ))}
        </div>
      </div>

      <ScrollReveal delay={150}>
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-hand text-4xl font-bold uppercase leading-[0.95] tracking-tight text-foreground md:text-7xl">
            {slide.kind === "brand" ? "NEXUS" : slide.product.name}
          </h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            {slide.kind === "brand"
              ? "Form / Function / Future"
              : formatVnd(slide.product.basePrice)}
          </p>
        </div>
        <Link
          href={
            slide.kind === "brand"
              ? "/products"
              : `/products/${slide.product.slug}`
          }
          className="group inline-flex items-center gap-3 self-start border-b border-muted-foreground/40 pb-1 text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-foreground md:self-end"
        >
          View product
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.5}
          />
        </Link>
      </div>
      </ScrollReveal>
    </section>
  );
}
