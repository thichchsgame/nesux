"use client";

import { ArrowRight, Check } from "lucide-react";
import { FormEvent, useState } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";

export function AccessBlock() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (email) setDone(true);
  }

  return (
    <section className="relative overflow-hidden border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-28">
        <div className="grid gap-10 md:grid-cols-2 md:items-end">
          <ScrollReveal y={24}>
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-background/50">
              Access — Early
            </span>
            <h2 className="font-hand mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-tight md:text-7xl">
              Join the
              <br />
              system
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-background/60">
              Drop mới, restock và lookbook — gửi trước khi công khai. Không
              spam, chỉ những gì đáng đọc.
            </p>
          </div>
          </ScrollReveal>
          <ScrollReveal delay={150} y={24}>
          <form onSubmit={submit} className="w-full">
            {done ? (
              <div className="font-hand flex items-center gap-3 border-b border-background pb-4 text-xl font-bold uppercase tracking-tight">
                <Check className="h-6 w-6" strokeWidth={2} />
                Đã đăng ký
              </div>
            ) : (
              <div className="flex items-center gap-4 border-b border-background pb-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="EMAIL ADDRESS"
                  aria-label="Email address"
                  className="w-full bg-transparent text-sm uppercase tracking-[0.2em] text-background placeholder:text-background/40 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Đăng ký"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background text-foreground transition-transform hover:scale-105"
                >
                  <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </form>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
