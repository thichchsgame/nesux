// app/checkout/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { listAddresses } from "@/lib/addresses";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export default async function CheckoutPage() {
  const session = await auth();
  const cart = await getOrCreateCart(session?.user?.id);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  const addresses = session?.user?.id ? await listAddresses(session.user.id) : [];

  const items = cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    productName: item.variant.product.name,
    size: item.variant.size,
    color: item.variant.color,
    image: item.variant.images[0]?.url ?? item.variant.product.images[0]?.url ?? null,
    quantity: item.quantity,
    unitPrice: Number(item.variant.priceOverride ?? item.variant.product.basePrice),
  }));

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CheckoutFlow
      isLoggedIn={!!session?.user?.id}
      userEmail={session?.user?.email ?? null}
      initialAddresses={addresses}
      items={items}
      subtotal={subtotal}
    />
  );
}