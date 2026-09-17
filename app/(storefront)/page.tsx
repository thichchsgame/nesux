import { AccessBlock } from "@/components/home/access-block";
import { HeroSystem } from "@/components/home/hero-system";
import { Lookbook } from "@/components/home/lookbook";
import { MarqueeHeadline } from "@/components/home/marquee-headline";
import { NewInGrid } from "@/components/home/new-in-grid";
import { SaleSection } from "@/components/home/sale-section";
import { SpecStrip } from "@/components/home/spec-strip";
import { StatementSection } from "@/components/home/statement-section";
import { Ticker } from "@/components/home/ticker";
import { VerticalCategories } from "@/components/home/vertical-categories";
import { ProductCard } from "@/components/product/product-card";
import {
  getHeroProducts,
  getHomepageCategories,
  getHomepageRecentlyViewed,
  getSaleProducts,
} from "@/lib/homepage";

export default async function Home() {
  const [heroProducts, saleProducts, categories, recentlyViewed] =
    await Promise.all([
      getHeroProducts(3),
      getSaleProducts(3),
      getHomepageCategories(),
      getHomepageRecentlyViewed(),
    ]);

  return (
    <div className="min-h-screen bg-background">
      <Ticker />
      <main>
        <HeroSystem products={heroProducts} />
        {recentlyViewed.length > 0 && (
          <section className="border-t border-border bg-background">
            <div className="mx-auto max-w-350 px-5 py-16 md:px-10 md:py-24">
              <h2 className="font-hand mb-10 text-2xl font-bold uppercase tracking-tight text-foreground md:text-4xl">
                Đã xem gần đây
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
                {recentlyViewed.map((product) => (
                  <ProductCard
                    key={product.slug}
                    {...product}
                    compareAtPrice={null}
                    hoverImage={null}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
        <MarqueeHeadline />
        <NewInGrid />
        <SaleSection products={saleProducts} />
        <SpecStrip />
        <Lookbook />
        <StatementSection />
        <VerticalCategories categories={categories} />
        <AccessBlock />
      </main>
    </div>
  );
}
