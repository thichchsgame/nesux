import { ProductCard } from "@/components/product/product-card";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getNewInProducts } from "@/lib/homepage";

export async function NewInGrid() {
  const products = await getNewInProducts(8);
  if (products.length === 0) return null;

  return (
    <section
      id="new-in"
      className="mx-auto max-w-[1400px] scroll-mt-20 border-t border-border px-5 py-16 md:px-10 md:py-24"
    >
      <ScrollReveal y={20} duration={500}>
      <div className="mb-10 flex items-end justify-between">
        <h2 className="font-hand text-2xl font-bold uppercase tracking-tight text-foreground md:text-4xl">
          New In
        </h2>
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {String(products.length).padStart(2, "0")} styles
        </span>
      </div>
      </ScrollReveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {products.map((product, index) => (
          <ScrollReveal key={product.slug} delay={(index % 4) * 70} y={28}>
            <ProductCard {...product} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
