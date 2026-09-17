import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { listWishlist } from "@/lib/wishlist";
import { RemoveWishlistButton } from "@/components/account/remove-wishlist-button";
import { WishlistAddToCartButton } from "@/components/account/wishlist-add-to-cart-button";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default async function AccountWishlistPage() {
  const session = await auth();
  const items = await listWishlist(session!.user!.id!);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-6 text-muted-foreground">
          Wishlist của bạn đang trống.
        </p>
        <Link
          href="/products"
          className="font-hand text-lg text-foreground underline"
        >
          Khám phá sản phẩm →
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Saved configurations
          </p>
          <h2 className="mt-2 font-hand text-3xl uppercase text-foreground">
            {items.length} sản phẩm
          </h2>
        </div>
        <Link
          href="/products"
          className="text-[10px] uppercase tracking-[0.16em] text-foreground underline underline-offset-4"
        >
          Tiếp tục mua sắm →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((w) => {
          const singleVariant =
            w.product.variants.length === 1 ? w.product.variants[0] : null;

          return (
            <article key={w.id} className="border border-border p-4">
              <Link
                href={`/products/${w.product.slug}`}
                className="block aspect-4/5 overflow-hidden bg-card"
              >
                {w.product.images[0] && (
                  <Image
                    src={w.product.images[0].url}
                    alt={w.product.name}
                    width={400}
                    height={500}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                )}
              </Link>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <Link href={`/products/${w.product.slug}`}>
                    <h3 className="font-hand text-lg uppercase text-foreground">
                      {w.product.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved configuration
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {fmt.format(Number(w.product.basePrice))}
                  </p>
                </div>
                <RemoveWishlistButton productId={w.productId} />
              </div>

              <div className="mt-4 flex gap-2">
                {singleVariant ? (
                  singleVariant.stock > 0 ? (
                    <WishlistAddToCartButton variantId={singleVariant.id} />
                  ) : (
                    <span className="flex-1 border border-border px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Hết hàng
                    </span>
                  )
                ) : (
                  <Link
                    href={`/products/${w.product.slug}`}
                    className="flex-1 border border-primary bg-primary px-3 py-3 text-center text-[10px] uppercase tracking-[0.14em] text-primary-foreground hover:bg-transparent hover:text-primary"
                  >
                    Chọn size / màu
                  </Link>
                )}
                <Link
                  href={`/products/${w.product.slug}`}
                  className="border border-border px-4 py-3 text-center text-[10px] uppercase tracking-[0.14em] text-foreground hover:border-foreground/40"
                >
                  Xem
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
