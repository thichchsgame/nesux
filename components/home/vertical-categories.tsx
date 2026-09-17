"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";

type Category = { name: string; slug: string; image: string | null };

export function VerticalCategories({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.name ?? "");
  if (categories.length === 0) return null;

  return (
    <section
      id="explore"
      className="scroll-mt-20 border-t border-border bg-background"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
        <ScrollReveal y={20}>
        <div className="flex items-end justify-between">
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Explore — Categories
          </span>
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            {String(categories.length).padStart(2, "0")} lines
          </span>
        </div>
        </ScrollReveal>
        <ScrollReveal delay={100} y={24}>
        <div className="mt-8 flex h-[420px] gap-2 md:h-[620px] md:gap-3">
          {categories.map((category, index) => {
            const isActive = category.name === active;
            return (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                onMouseEnter={() => setActive(category.name)}
                onFocus={() => setActive(category.name)}
                aria-label={`Khám phá ${category.name}`}
                className={`group relative flex overflow-hidden border border-border transition-all duration-500 ease-out ${isActive ? "flex-[2.4] md:flex-[3]" : "flex-[1]"}`}
              >
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 40vw, 22vw"
                    className={`object-cover transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}
                  />
                )}
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${isActive ? "bg-gradient-to-t from-background via-background/40 to-transparent opacity-100" : "opacity-0"}`}
                />
                <span className="absolute left-3 top-4 text-[11px] tracking-[0.2em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={`font-hand absolute bottom-5 left-1/2 -translate-x-1/2 text-lg font-bold uppercase tracking-tight transition-colors md:text-2xl [writing-mode:vertical-rl] rotate-180 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
