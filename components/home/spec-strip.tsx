import { ScrollReveal } from "@/components/scroll-reveal";

const STATS = [
  { value: "05", label: "Danh mục sản phẩm" },
  { value: "100%", label: "Utility built" },
  { value: "48H", label: "Giao hàng nội thành (dự kiến)" },
  { value: "∞", label: "Modular layers" },
];

export function SpecStrip() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-border md:grid-cols-4">
        {STATS.map((stat, index) => (
          <ScrollReveal key={stat.label} delay={index * 80} y={24}>
          <div
            className="bg-background px-5 py-12 md:px-10 md:py-16"
          >
            <div className="font-hand text-5xl font-bold tracking-tight text-foreground md:text-7xl">
              {stat.value}
            </div>
            <div className="mt-4 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {stat.label}
            </div>
          </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
