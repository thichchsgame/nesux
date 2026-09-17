import Link from "next/link";
import { Search, X } from "lucide-react";
import { getAvailableColors, getAvailableSizes, getCategoryTree, getProducts, searchProducts, type SortOption } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";
import { ScrollReveal } from "@/components/scroll-reveal";

const SORTS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Mới nhất" }, { id: "price_asc", label: "Giá ↑" },
  { id: "price_desc", label: "Giá ↓" }, { id: "name_asc", label: "A — Z" },
];

function buildQuery(current: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...overrides })) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
}

type SearchParams = { category?: string; size?: string; color?: string; minPrice?: string; maxPrice?: string; sort?: string; page?: string; q?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const current: Record<string, string | undefined> = { category: sp.category, size: sp.size, color: sp.color, minPrice: sp.minPrice, maxPrice: sp.maxPrice, sort: sp.sort, page: sp.page, q: sp.q };
  const isSearch = Boolean(sp.q?.trim());
  const [categoryTree, availableSizes, availableColors, listResult, searchResults] = await Promise.all([
    getCategoryTree(), getAvailableSizes(sp.category), getAvailableColors(sp.category),
    isSearch ? Promise.resolve(null) : getProducts({ categorySlug: sp.category, size: sp.size, color: sp.color, minPrice: sp.minPrice ? Number(sp.minPrice) : undefined, maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined, sort: sp.sort as SortOption | undefined, page: sp.page ? Number(sp.page) : 1 }),
    isSearch ? searchProducts(sp.q!, 40) : Promise.resolve(null),
  ]);
  const products = isSearch ? searchResults! : listResult!.products;
  const hasActiveFilter = Boolean(sp.category || sp.minPrice || sp.maxPrice || sp.size || sp.color);

  return <div className="min-h-screen bg-background"><div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-16">
    <div className="mb-10 flex flex-col gap-4 border-b border-border pb-8 md:mb-12"><span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Index / Catalogue</span><h1 className="font-hand text-4xl font-bold uppercase leading-[0.95] tracking-tight text-foreground md:text-6xl">{isSearch ? `Kết quả cho "${sp.q}"` : "Toàn bộ hệ thống"}</h1>{!isSearch && <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">Mọi sản phẩm trong dòng NEXUS hiện tại. Tìm theo tên, lọc theo danh mục, size, màu và sắp xếp để tìm đúng cấu hình của bạn.</p>}</div>
    <form action="/products" method="get" className="flex items-center gap-3 border border-border bg-foreground/[0.02] px-4"><Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.5} /><input type="search" name="q" defaultValue={sp.q} placeholder="TÌM KIẾM TRONG HỆ THỐNG" aria-label="Tìm sản phẩm" className="w-full bg-transparent py-4 text-[13px] uppercase tracking-[0.15em] text-foreground placeholder:text-muted-foreground/60 focus:outline-none" />{sp.q && <Link href="/products" aria-label="Xoá tìm kiếm" className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"><X className="h-4 w-4" strokeWidth={1.5} /></Link>}</form>
    {!isSearch && <><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-b border-border pb-6"><Link href="/products" className={`text-[11px] uppercase tracking-[0.2em] transition-colors ${!sp.category ? "text-foreground underline decoration-1 underline-offset-[6px]" : "text-muted-foreground hover:text-foreground"}`}>Tất cả</Link>{categoryTree.map((category) => <Link key={category.id} href={`/products${buildQuery(current, { category: category.slug, size: undefined, color: undefined, page: undefined })}`} className={`text-[11px] uppercase tracking-[0.2em] transition-colors ${sp.category === category.slug ? "text-foreground underline decoration-1 underline-offset-[6px]" : "text-muted-foreground hover:text-foreground"}`}>{category.name}</Link>)}</div>
      <div className="mt-6 flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:flex-wrap md:items-center md:justify-between"><div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {availableSizes.length > 0 && <div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Size</span><div className="flex flex-wrap gap-1.5">{availableSizes.map((size) => <Link key={size} href={`/products${buildQuery(current, { size: sp.size === size ? undefined : size, page: undefined })}`} className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] transition-colors ${sp.size === size ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>{size}</Link>)}</div></div>}
        {availableColors.length > 0 && <div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Màu</span><div className="flex flex-wrap gap-2">{availableColors.map((color) => <Link key={color.name} href={`/products${buildQuery(current, { color: sp.color === color.name ? undefined : color.name, page: undefined })}`} title={color.name} aria-label={color.name} className={`h-5 w-5 rounded-full border-2 transition-all ${sp.color === color.name ? "border-foreground" : "border-transparent hover:border-muted-foreground"}`} style={{ backgroundColor: color.hex ?? "#8a8a8a" }} />)}</div></div>}
        <form action="/products" method="get" className="flex items-center gap-2">{sp.category && <input type="hidden" name="category" value={sp.category} />}{sp.size && <input type="hidden" name="size" value={sp.size} />}{sp.color && <input type="hidden" name="color" value={sp.color} />}<span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Giá</span><input name="minPrice" type="number" placeholder="Từ" defaultValue={sp.minPrice} className="w-20 border border-border bg-transparent px-2 py-1 text-[11px] text-foreground" /><input name="maxPrice" type="number" placeholder="Đến" defaultValue={sp.maxPrice} className="w-20 border border-border bg-transparent px-2 py-1 text-[11px] text-foreground" /><button className="border border-border px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-foreground hover:text-background">Lọc</button></form>
      </div><div className="flex items-center gap-4"><span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">Sắp xếp</span><div className="flex gap-x-4">{SORTS.map((sort) => <Link key={sort.id} href={`/products${buildQuery(current, { sort: sort.id, page: undefined })}`} className={`text-[11px] uppercase tracking-[0.2em] transition-colors ${(sp.sort ?? "newest") === sort.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{sort.label}</Link>)}</div></div></div></>}
    <div className="mt-6 flex items-center justify-between"><span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{String(products.length).padStart(2, "0")} kết quả</span>{(isSearch || hasActiveFilter) && <Link href="/products" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground">Đặt lại</Link>}</div>
    {products.length === 0 ? <div className="mt-20 flex flex-col items-center justify-center gap-3 py-20 text-center"><p className="font-hand text-lg uppercase tracking-wide text-foreground">Không có kết quả</p><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Điều chỉnh bộ lọc hoặc từ khoá tìm kiếm</p></div> : <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{products.map((product, index) => <ScrollReveal key={product.id} delay={(index % 4) * 60} y={20} duration={450}><ProductCard {...product} /></ScrollReveal>)}</div>}
    {!isSearch && listResult!.totalPages > 1 && <div className="mt-12 flex justify-center gap-2 font-mono text-sm">{Array.from({ length: listResult!.totalPages }, (_, index) => index + 1).map((page) => <Link key={page} href={`/products${buildQuery(current, { page: String(page) })}`} className={page === listResult!.page ? "border border-foreground px-3 py-1 text-foreground" : "border border-border px-3 py-1 text-muted-foreground"}>{page}</Link>)}</div>}
  </div></div>;
}
