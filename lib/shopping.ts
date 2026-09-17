import "server-only";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

type Identity = { userId?: string; guestEmail?: string };

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  variants: {
    id: string;
    size: string | null;
    color: string | null;
    stock: number;
  }[];
};

export type CartSummary = {
  itemCount: number;
  subtotal: number;
  items: {
    variantId: string;
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export async function searchProductsForChat(
  query: string,
): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      name: { contains: query, mode: "insensitive" },
    },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { select: { id: true, size: true, color: true, stock: true } },
    },
    take: 5,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images[0]?.url ?? null,
    price: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    variants: p.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
    })),
  }));
}

export async function getCartSummary(identity: Identity): Promise<CartSummary> {
  const cart = await getOrCreateCart(identity.userId);
  const items = cart.items.map((item) => {
    const unitPrice = Number(
      item.variant.priceOverride ?? item.variant.product.basePrice,
    );
    return {
      variantId: item.variantId,
      name: item.variant.product.name,
      size: item.variant.size,
      color: item.variant.color,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });
  return {
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    items,
  };
}

export async function addVariantToCart(
  identity: Identity,
  variantId: string,
  quantity: number,
) {
  const qty = Math.max(1, Math.floor(quantity));

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant)
    return {
      ok: false as const,
      error: "Không tìm thấy biến thể sản phẩm này.",
    };
  if (variant.product.status !== "PUBLISHED")
    return { ok: false as const, error: "Sản phẩm hiện không còn bán." };
  if (variant.stock < qty) {
    return {
      ok: false as const,
      error: `Chỉ còn ${variant.stock} sản phẩm trong kho, không đủ số lượng yêu cầu.`,
    };
  }

  const cart = await getOrCreateCart(identity.userId);
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: { increment: qty } },
    create: { cartId: cart.id, variantId, quantity: qty },
  });

  return {
    ok: true as const,
    productName: variant.product.name,
    size: variant.size,
    color: variant.color,
    cart: await getCartSummary(identity),
  };
}
