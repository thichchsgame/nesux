import { prisma } from "./prisma";

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

export type ProductListParams = {
  categorySlug?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  image: string | null;
  hoverImage: string | null;
  colors: { name: string; hex: string | null }[];
};

export type ProductListResult = {
  products: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Lấy toàn bộ id danh mục con (đệ quy, không giới hạn độ sâu) của 1 category slug.
 * VD: filter theo "ao" (Áo) sẽ trả về cả "ao-khoac", "ao-thun" bên trong.
 */
async function getCategoryIdsIncludingChildren(
  categorySlug: string,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE descendants AS (
      SELECT id FROM "categories" WHERE slug = ${categorySlug}
      UNION ALL
      SELECT c.id FROM "categories" c
      INNER JOIN descendants d ON c."parentId" = d.id
    )
    SELECT id FROM descendants;
  `;
  return rows.map((r) => r.id);
}

export async function getProducts(
  params: ProductListParams,
): Promise<ProductListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 12));

  const where: Record<string, unknown> = { status: "PUBLISHED" };

  if (params.categorySlug) {
    const categoryIds = await getCategoryIdsIncludingChildren(
      params.categorySlug,
    );
    if (categoryIds.length === 0) {
      // slug không tồn tại — trả rỗng thay vì query sai (không filter gì) gây lộ toàn bộ sản phẩm
      return { products: [], total: 0, page, pageSize, totalPages: 0 };
    }
    where.categoryId = { in: categoryIds };
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.basePrice = {
      ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
      ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
    };
  }

  if (params.size || params.color) {
    where.variants = {
      some: {
        ...(params.size ? { size: params.size } : {}),
        ...(params.color ? { color: params.color } : {}),
      },
    };
  }

  const orderBy =
    params.sort === "price_asc"
      ? { basePrice: "asc" as const }
      : params.sort === "price_desc"
        ? { basePrice: "desc" as const }
        : params.sort === "name_asc"
          ? { name: "asc" as const }
          : { createdAt: "desc" as const }; // "newest" mặc định

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { position: "asc" }, take: 2 },
        variants: { select: { color: true, colorHex: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const products: ProductListItem[] = rows.map((p) => {
    const seen = new Map<string, string | null>();
    for (const variant of p.variants) {
      if (variant.color && !seen.has(variant.color)) {
        seen.set(variant.color, variant.colorHex);
      }
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: Number(p.basePrice),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      image: p.images[0]?.url ?? null,
      hoverImage: p.images[1]?.url ?? null,
      colors: Array.from(seen, ([name, hex]) => ({ name, hex })),
    };
  });

  return {
    products,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { size: "asc" } },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, image: true } },
          adminRepliedBy: { select: { name: true } },
          media: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (!product) return null;

  // avgRating/reviewCount PHẢI tính trên toàn bộ review PUBLISHED, không phải chỉ 10 review
  // vừa fetch ở trên (bug Phase 2 — file cũ vẫn đang tính sai trên product.reviews.length).
  const ratingAgg = await prisma.review.aggregate({
    where: { productId: product.id, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    ...product,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
    avgRating: ratingAgg._avg.rating,
    reviewCount: ratingAgg._count.rating,
  };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductListItem[]> {
  const rows = await prisma.product.findMany({
    where: {
      categoryId,
      status: "PUBLISHED",
      id: { not: productId },
    },
    take: limit,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    image: p.images[0]?.url ?? null,
    hoverImage: null,
    colors: [],
  }));
}

/**
 * Full-text search dùng cột "searchVector" (generated column, xem migration
 * add_product_search_vector). ts_rank để sắp theo độ liên quan, không phải theo ngày tạo.
 */
export async function searchProducts(
  query: string,
  limit = 20,
): Promise<ProductListItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const rows = await prisma.$queryRaw<
    {
      id: string;
      name: string;
      slug: string;
      basePrice: string;
      compareAtPrice: string | null;
      image: string | null;
    }[]
  >`
    SELECT
      p.id, p.name, p.slug, p."basePrice", p."compareAtPrice",
      (SELECT pi.url FROM "product_images" pi WHERE pi."productId" = p.id ORDER BY pi.position ASC LIMIT 1) AS image
    FROM "products" p
    WHERE p.status = 'PUBLISHED'
      AND p."searchVector" @@ websearch_to_tsquery('simple', ${trimmed})
    ORDER BY ts_rank(p."searchVector", websearch_to_tsquery('simple', ${trimmed})) DESC
    LIMIT ${limit};
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    basePrice: Number(r.basePrice),
    compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : null,
    image: r.image,
    hoverImage: null,
    colors: [],
  }));
}

/** Danh mục cho sidebar filter / nav — chỉ lấy danh mục cha kèm con trực tiếp. */
export async function getCategoryTree() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export type VariantInput = {
  id?: string; // có id = đang sửa variant cũ, không có = tạo mới
  sku: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  priceOverride?: number | null;
  stock: number;
};

export type ProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  basePrice: number;
  compareAtPrice?: number | null;
  attributes?: Record<string, string | number | boolean> | null;
  tags?: string[];
  heroTagline?: string | null;
  categoryId: string;
  imageUrls: string[]; // danh sách URL, thứ tự = thứ tự hiển thị
  variants: VariantInput[];
};

export async function getProductForAdmin(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!product) return null;
  return {
    ...product,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null,
    variants: product.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
  };
}

export async function listProductsForAdmin(params?: {
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 30;

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { select: { stock: true } },
      },
    }),
    prisma.product.count(),
  ]);

  const products = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    basePrice: Number(p.basePrice),
    categoryName: p.category.name,
    image: p.images[0]?.url ?? null,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    updatedAt: p.updatedAt,
  }));

  return { products, total, page, pageSize };
}

function validateProductInput(data: ProductInput): string | null {
  if (!data.name.trim()) return "Vui lòng nhập tên sản phẩm.";
  if (!data.slug.trim()) return "Vui lòng nhập slug.";
  if (data.basePrice <= 0) return "Giá phải lớn hơn 0.";
  if (!data.categoryId) return "Vui lòng chọn danh mục.";
  if (data.variants.length === 0) return "Cần ít nhất 1 biến thể (size/màu).";
  for (const v of data.variants) {
    if (!v.sku.trim()) return "Mỗi biến thể cần có SKU.";
    if (v.stock < 0) return "Tồn kho không được âm.";
  }
  return null;
}

export async function createProduct(data: ProductInput) {
  const error = validateProductInput(data);
  if (error) throw new Error(error);

  return prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status,
      basePrice: data.basePrice,
      compareAtPrice: data.compareAtPrice ?? undefined,
      attributes: data.attributes ?? undefined,
      tags: data.tags ?? [],
      heroTagline: data.heroTagline ?? undefined,
      categoryId: data.categoryId,
      images: {
        create: data.imageUrls.map((url, i) => ({ url, position: i })),
      },
      variants: {
        create: data.variants.map((v) => ({
          sku: v.sku,
          size: v.size ?? undefined,
          color: v.color ?? undefined,
          colorHex: v.colorHex ?? undefined,
          priceOverride: v.priceOverride ?? undefined,
          stock: v.stock,
        })),
      },
    },
  });
}

export async function updateProduct(id: string, data: ProductInput) {
  const error = validateProductInput(data);
  if (error) throw new Error(error);

  return prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice ?? undefined,
        attributes: data.attributes ?? undefined,
        tags: data.tags ?? [],
        heroTagline: data.heroTagline ?? undefined,
        categoryId: data.categoryId,
      },
    });

    // Ảnh: xoá hết ảnh cũ, tạo lại theo danh sách mới — đơn giản, đủ dùng vì admin
    // luôn gửi lại toàn bộ danh sách ảnh hiện tại mỗi lần lưu (không có thao tác
    // "chỉ sửa 1 ảnh" riêng lẻ ở UI).
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productImage.createMany({
      data: data.imageUrls.map((url, i) => ({
        productId: id,
        url,
        position: i,
      })),
    });

    // Variant: variant có `id` → update, không có `id` → create mới.
    // Variant cũ không còn trong danh sách gửi lên → xoá (nghĩa là admin đã bỏ nó ở form).
    const keepIds = data.variants.filter((v) => v.id).map((v) => v.id!);
    await tx.productVariant.deleteMany({
      where: {
        productId: id,
        NOT: { id: { in: keepIds.length > 0 ? keepIds : ["__none__"] } },
      },
    });

    for (const v of data.variants) {
      if (v.id) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            sku: v.sku,
            size: v.size ?? undefined,
            color: v.color ?? undefined,
            colorHex: v.colorHex ?? undefined,
            priceOverride: v.priceOverride ?? undefined,
            stock: v.stock,
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId: id,
            sku: v.sku,
            size: v.size ?? undefined,
            color: v.color ?? undefined,
            colorHex: v.colorHex ?? undefined,
            priceOverride: v.priceOverride ?? undefined,
            stock: v.stock,
          },
        });
      }
    }
  });
}

export async function deleteProduct(id: string) {
  // Chặn xoá nếu đã có OrderItem tham chiếu tới variant của sản phẩm này — lịch sử
  // đơn hàng cũ cần giữ nguyên (đã có snapshot riêng trong OrderItem, nhưng xoá Product
  // sẽ cascade xoá luôn Variant, làm OrderItem.variantId thành null, mất liên kết truy vết).
  // An toàn hơn: chuyển status sang ARCHIVED thay vì xoá thật nếu đã từng bán.
  const hasOrders = await prisma.orderItem.findFirst({
    where: { variant: { productId: id } },
  });
  if (hasOrders) {
    await prisma.product.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    return { archived: true };
  }
  await prisma.product.delete({ where: { id } });
  return { archived: false };
}

export async function getProductsByIds(
  ids: string[],
): Promise<ProductListItem[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  const byId = new Map(rows.map((product) => [product.id, product]));

  return ids.flatMap((id) => {
    const product = byId.get(id);
    if (!product) return [];
    return [
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: Number(product.basePrice),
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : null,
        image: product.images[0]?.url ?? null,
        hoverImage: null,
        colors: [],
      },
    ];
  });
}

function compareSizes(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  const order = ["XS", "S", "M", "L", "XL", "XXL"];
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  return a.localeCompare(b);
}

/** Sizes currently present in published products, optionally scoped to a category. */
export async function getAvailableSizes(
  categorySlug?: string,
): Promise<string[]> {
  const where: Record<string, unknown> = {
    product: { status: "PUBLISHED" },
    size: { not: null },
  };
  if (categorySlug) {
    const categoryIds = await getCategoryIdsIncludingChildren(categorySlug);
    where.product = { status: "PUBLISHED", categoryId: { in: categoryIds } };
  }
  const rows = await prisma.productVariant.findMany({
    where,
    distinct: ["size"],
    select: { size: true },
  });
  return rows.map((row) => row.size!).sort(compareSizes);
}

/** Colors currently present in published products, with optional swatch hex values. */
export async function getAvailableColors(
  categorySlug?: string,
): Promise<{ name: string; hex: string | null }[]> {
  const where: Record<string, unknown> = {
    product: { status: "PUBLISHED" },
    color: { not: null },
  };
  if (categorySlug) {
    const categoryIds = await getCategoryIdsIncludingChildren(categorySlug);
    where.product = { status: "PUBLISHED", categoryId: { in: categoryIds } };
  }
  const rows = await prisma.productVariant.findMany({
    where,
    distinct: ["color"],
    select: { color: true, colorHex: true },
  });
  return rows.map((row) => ({ name: row.color!, hex: row.colorHex }));
}

/** Products occurring in the same delivered orders as the requested product. */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit = 4,
): Promise<ProductListItem[]> {
  const safeLimit = Math.min(12, Math.max(1, Math.floor(limit)));
  const rows = await prisma.$queryRaw<
    { productId: string; frequency: number }[]
  >`
    SELECT p.id AS "productId", COUNT(DISTINCT oi."orderId")::int AS frequency
    FROM "order_items" oi
    JOIN "orders" o ON o.id = oi."orderId"
    JOIN "product_variants" v ON v.id = oi."variantId"
    JOIN "products" p ON p.id = v."productId"
    WHERE o.status = 'DELIVERED'
      AND oi."orderId" IN (
        SELECT oi2."orderId"
        FROM "order_items" oi2
        JOIN "product_variants" v2 ON v2.id = oi2."variantId"
        WHERE v2."productId" = ${productId}
      )
      AND p.id != ${productId}
      AND p.status = 'PUBLISHED'
    GROUP BY p.id
    ORDER BY frequency DESC, p.id ASC
    LIMIT ${safeLimit};
  `;

  return getProductsByIds(rows.map((row) => row.productId));
}
