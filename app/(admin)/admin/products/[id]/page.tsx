import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductForAdmin } from "@/lib/products";
import { ProductForm } from "@/components/admin/product-form";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForAdmin(id),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    status: product.status,
    basePrice: String(product.basePrice),
    compareAtPrice: product.compareAtPrice
      ? String(product.compareAtPrice)
      : "",
    heroTagline: product.heroTagline ?? "",
    categoryId: product.categoryId,
    tags: product.tags,
    updatedAt: product.updatedAt.toISOString(),
    imageUrls: product.images.map((img) => img.url),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size ?? "",
      color: v.color ?? "",
      colorHex: v.colorHex ?? "#1a1a1a",
      priceOverride: v.priceOverride ? String(v.priceOverride) : "",
      stock: String(v.stock),
    })),
  };

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title={product.name} crumb={`Products / ${product.name}`} />
      <ProductForm categories={categories} initialData={initialData} />
    </div>
  );
}
