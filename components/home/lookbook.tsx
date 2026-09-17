import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

export function Lookbook() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-28">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Lookbook — Vol. 01
            </span>
            <h2 className="font-hand mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-tight text-foreground md:text-6xl">
              Field
              <br />
              notes
            </h2>
          </div>
          <span className="hidden text-[11px] uppercase tracking-[0.25em] text-muted-foreground md:block">
            FW—26 / Urban
          </span>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-12 md:gap-6">
          <ScrollReveal scale duration={800} className="order-1 md:col-span-7">
          <figure className="relative">
            <div className="relative aspect-[4/3] overflow-hidden bg-card">
              <Image
                src="/editorial/fabric-macro.png"
                alt="Chi tiết chất liệu kỹ thuật NEXUS"
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover"
              />
              <span className="font-hand absolute bottom-4 left-4 text-6xl font-bold leading-none text-foreground/90 md:text-8xl">
                01
              </span>
            </div>
            <figcaption className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Fabric / Hardware — sealed against the elements
            </figcaption>
          </figure>
          </ScrollReveal>
          <div className="order-2 flex flex-col gap-4 md:col-span-5 md:gap-6">
            <ScrollReveal scale duration={800} delay={120}>
            <figure className="relative">
              <div className="relative aspect-[4/3] overflow-hidden bg-card">
                <Image
                  src="/editorial/concrete.png"
                  alt="Bối cảnh đô thị"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
                <span className="font-hand absolute bottom-4 left-4 text-5xl font-bold leading-none text-foreground/90 md:text-7xl">
                  02
                </span>
              </div>
              <figcaption className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Environment — built for the concrete grid
              </figcaption>
            </figure>
            </ScrollReveal>
            <ScrollReveal delay={240}>
            <Link
              href="/#new-in"
              className="group flex flex-1 items-center justify-between border border-border px-6 py-8 transition-colors hover:bg-foreground"
            >
              <span className="font-hand text-xl font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-background md:text-2xl">
                Shop the drop
              </span>
              <ArrowUpRight
                className="h-6 w-6 text-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-background"
                strokeWidth={1.5}
              />
            </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
