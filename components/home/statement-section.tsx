import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

export function StatementSection() {
  return (
    <section
      id="statement"
      className="scroll-mt-20 border-t border-border bg-background"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-10 md:py-28">
        <div>
          <ScrollReveal y={20}>
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            The System
          </span>
          </ScrollReveal>
          <ScrollReveal delay={100} y={24}>
          <h2 className="font-hand mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-tight text-foreground md:text-6xl">
            Built for the
            <br />
            everyday system
          </h2>
          </ScrollReveal>
          <ScrollReveal delay={180} y={20}>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            NEXUS là thời trang utility hiện đại, thiết kế cho chuyển động. Bền,
            thoải mái và có thể phối lớp — từng món đồ được làm để layer, thích
            ứng và dùng bền lâu, không chỉ cho một outfit.
          </p>
          </ScrollReveal>
          <ScrollReveal delay={260} y={16}>
          <Link
            href="/#new-in"
            className="group mt-10 inline-flex items-center gap-5"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-muted-foreground/40 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
              <ArrowUpRight className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-foreground">
              Xem thêm
            </span>
          </Link>
          </ScrollReveal>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ScrollReveal delay={100} scale duration={800} className="col-span-2">
          <div className="relative aspect-[16/10] overflow-hidden bg-card">
            <Image
              src="/products/shell-detail.png"
              alt="Chi tiết chất liệu và phụ kiện NEXUS"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-contain"
            />
          </div>
          </ScrollReveal>
          <ScrollReveal delay={180} scale duration={800}>
          <div className="relative aspect-square overflow-hidden bg-card">
            <Image
              src="/products/shell-fabric.png"
              alt="Mẫu vải kỹ thuật NEXUS"
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              className="object-cover"
            />
          </div>
          </ScrollReveal>
          <ScrollReveal delay={260} scale duration={800}>
          <div className="relative aspect-square overflow-hidden bg-card">
            <Image
              src="/products/accessories.png"
              alt="Phụ kiện NEXUS"
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              className="object-contain"
            />
          </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
