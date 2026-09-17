import "server-only";
import { prisma } from "@/lib/prisma";

export async function listWishlist(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: { select: { id: true, stock: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addToWishlist(userId: string, productId: string) {
  await prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlist.deleteMany({ where: { userId, productId } });
}

export async function isInWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  const item = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return !!item;
}
