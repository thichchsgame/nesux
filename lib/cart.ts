import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getCartSessionToken } from "@/lib/cart-session";

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: { include: { images: true } },
          images: true,
        },
      },
    },
  },
} as const;

export async function getOrCreateCart(userId?: string) {
  if (userId) {
    try {
      return await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include: cartInclude,
      });
    } catch (e) {
      // Race condition: 2 request cùng cố tạo cart cho cùng 1 user gần như đồng thời
      // (VD signIn callback + Header render lúc vừa đăng nhập Google). Nếu bị đúng lỗi
      // unique constraint (P2002), nghĩa là request kia đã tạo xong trước — chỉ cần đọc lại.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return prisma.cart.findUniqueOrThrow({ where: { userId }, include: cartInclude });
      }
      throw e;
    }
  }

  const token = await getCartSessionToken();
  try {
    return await prisma.cart.upsert({
      where: { sessionToken: token },
      update: {},
      create: { sessionToken: token },
      include: cartInclude,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return prisma.cart.findUniqueOrThrow({ where: { sessionToken: token }, include: cartInclude });
    }
    throw e;
  }
}

export async function addToCart(variantId: string, quantity: number, userId?: string) {
  if (quantity < 1) throw new Error("Số lượng phải >= 1");

  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.variantId === variantId);
  const nextQty = (existing?.quantity ?? 0) + quantity;

  if (nextQty > variant.stock) {
    throw new Error(`Chỉ còn ${variant.stock} sản phẩm trong kho.`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: nextQty },
    create: { cartId: cart.id, variantId, quantity: nextQty },
  });
}

export async function updateCartItemQuantity(itemId: string, quantity: number, userId?: string) {
  if (quantity < 1) return removeCartItem(itemId, userId);

  const item = await prisma.cartItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { variant: true, cart: true },
  });
  await assertOwnsCart(item.cart, userId);

  if (quantity > item.variant.stock) {
    throw new Error(`Chỉ còn ${item.variant.stock} sản phẩm trong kho.`);
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

export async function removeCartItem(itemId: string, userId?: string) {
  const item = await prisma.cartItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { cart: true },
  });
  await assertOwnsCart(item.cart, userId);
  await prisma.cartItem.delete({ where: { id: itemId } });
}

async function assertOwnsCart(
  cart: { userId: string | null; sessionToken: string | null },
  userId?: string
) {
  if (userId) {
    if (cart.userId !== userId) throw new Error("Không có quyền truy cập giỏ hàng này.");
    return;
  }
  const token = await getCartSessionToken();
  if (cart.sessionToken !== token) throw new Error("Không có quyền truy cập giỏ hàng này.");
}

// Gọi 1 lần lúc user vừa đăng nhập xong (từ callback signIn trong lib/auth.ts)
export async function mergeGuestCartIntoUserCart(userId: string) {
  const token = await getCartSessionToken();

  const guestCart = await prisma.cart.findUnique({
    where: { sessionToken: token },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const guestItem of guestCart.items) {
      const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: guestItem.variantId } });
      const existing = userCart.items.find((i) => i.variantId === guestItem.variantId);
      const finalQty = Math.min((existing?.quantity ?? 0) + guestItem.quantity, variant.stock);
      if (finalQty < 1) continue;

      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: guestItem.variantId } },
        update: { quantity: finalQty },
        create: { cartId: userCart.id, variantId: guestItem.variantId, quantity: finalQty },
      });
    }
    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}