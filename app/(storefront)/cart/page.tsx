import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { CartItemRow } from "@/components/cart/cart-item-row";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default async function CartPage() {
  const session = await auth();
  const cart = await getOrCreateCart(session?.user?.id);

  const rows = cart.items.map((item) => {
    const price = item.variant.priceOverride ?? item.variant.product.basePrice;
    return {
      itemId: item.id,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      size: item.variant.size,
      color: item.variant.color,
      stock: item.variant.stock,
      quantity: item.quantity,
      unitPrice: Number(price),
      image:
        item.variant.images[0]?.url ??
        item.variant.product.images[0]?.url ??
        null,
    };
  });

  const subtotal = rows.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-20">
      <div className="border-b border-border pb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Lựa chọn của bạn
        </p>
        <h1 className="mt-3 font-hand text-5xl font-bold uppercase tracking-tight text-foreground">
          Giỏ hàng
        </h1>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            Giỏ hàng của bạn hiện đang trống.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 bg-foreground px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-background"
          >
            Khám phá bộ sưu tập <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-12 py-10 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col divide-y divide-border">
            {rows.map((r) => (
              <CartItemRow key={r.itemId} {...r} />
            ))}
          </div>

          <aside className="h-fit border border-border p-6">
            <h2 className="font-hand text-xl uppercase text-foreground">
              Tóm tắt đơn hàng
            </h2>

            <div className="mt-6 flex flex-col gap-4 border-b border-border pb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{fmt.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="text-muted-foreground">Tính ở bước sau</span>
              </div>
            </div>

            <div className="mt-6 flex justify-between font-hand text-xl text-foreground">
              <span>Tổng cộng</span>
              <span>{fmt.format(subtotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="mt-7 flex items-center justify-center gap-2 bg-foreground px-5 py-4 text-[11px] uppercase tracking-[0.2em] text-background"
            >
              Tiến hành thanh toán <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
