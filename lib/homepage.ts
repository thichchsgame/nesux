import { prisma } from "@/lib/prisma";
import { getCategoryTree } from "@/lib/products";

export async function getHeroProducts(limit = 3) {
  const rows = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: true,
    },
  });

  return rows.map((p) => ({
    slug: p.slug,
    name: p.name,
    categoryName: p.category.name,
    basePrice: Number(p.basePrice),
    image: p.images[0]?.url ?? null,
    heroTagline:
      p.heroTagline ??
      (p.tags.length > 0 ? p.tags.slice(0, 3).join(" / ") : p.category.name),
  }));
}

export async function getNewInProducts(limit = 8) {
  const rows = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      images: { orderBy: { position: "asc" }, take: 2 },
      category: true,
    },
  });

  return rows.map((product) => ({
    slug: product.slug,
    name: product.name,
    categoryName: product.category.name,
    basePrice: Number(product.basePrice),
    image: product.images[0]?.url ?? null,
    hoverImage: product.images[1]?.url ?? product.images[0]?.url ?? null,
  }));
}

/** Published products whose listed price is genuinely below the compare-at price. */
export async function getSaleProducts(limit = 3) {
  const rows = await prisma.product.findMany({
    where: { status: "PUBLISHED", compareAtPrice: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      category: true,
    },
  });

  return rows
    .map((product) => {
      const basePrice = Number(product.basePrice);
      const compareAtPrice = product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null;
      if (!compareAtPrice || compareAtPrice <= basePrice) return null;

      return {
        slug: product.slug,
        name: product.name,
        categoryName: product.category.name,
        basePrice,
        compareAtPrice,
        percentOff: Math.round(
          ((compareAtPrice - basePrice) / compareAtPrice) * 100,
        ),
        image: product.images[0]?.url ?? null,
      };
    })
    .filter(
      (product): product is NonNullable<typeof product> => product !== null,
    )
    .slice(0, limit);
}

export async function getHomepageCategories() {
  const tree = await getCategoryTree();

  return Promise.all(
    tree.map(async (category) => {
      if (category.image)
        return {
          name: category.name,
          slug: category.slug,
          image: category.image,
        };

      const sample = await prisma.product.findFirst({
        where: { categoryId: category.id, status: "PUBLISHED" },
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      });
      return {
        name: category.name,
        slug: category.slug,
        image: sample?.images[0]?.url ?? null,
      };
    }),
  );
}

export async function getHomepageRecentlyViewed(
  excludeIds: string[] = [],
  limit = 4,
) {
  const { getRecentlyViewedIds } = await import("@/lib/recently-viewed");
  const ids = (await getRecentlyViewedIds())
    .filter((id) => !excludeIds.includes(id))
    .slice(0, limit);
  if (ids.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  const byId = new Map(rows.map((product) => [product.id, product]));

  return ids
    .map((id) => byId.get(id))
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product),
    )
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      basePrice: Number(product.basePrice),
      image: product.images[0]?.url ?? null,
    }));
}
