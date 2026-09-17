import Image from "next/image";
import Link from "next/link";
import { searchProducts } from "@/lib/products";

function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim();
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10">
      <form className="mb-10 max-w-xl" action="/search">
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="Tìm sản phẩm..." autoFocus className="w-full border-b border-border bg-transparent py-3 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none" />
      </form>
      {!query ? (
        <p className="text-sm text-muted-foreground">Nhập từ khoá để tìm sản phẩm.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm nào cho &quot;{query}&quot;.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {results.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group">
              <div className="relative mb-3 aspect-[3/4] overflow-hidden bg-card">
                {product.image && <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
              </div>
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-sm text-muted-foreground">{formatVnd(product.basePrice)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
