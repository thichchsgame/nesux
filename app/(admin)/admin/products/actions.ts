"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createProduct, updateProduct, deleteProduct } from "@/lib/products";

type ActionResult = { ok: true } | { ok: false; error: string };

type VariantInput = {
  id?: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  priceOverride?: number | null;
  stock: number;
};

type ProductFormInput = {
  name: string;
  slug: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  basePrice: number;
  compareAtPrice?: number | null;
  heroTagline?: string | null;
  categoryId: string;
  imageUrls: string[];
  variants: VariantInput[];
};

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Không có quyền thực hiện thao tác này.");
}

export async function createProductAction(data: ProductFormInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    await createProduct(data);
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function updateProductAction(id: string, data: ProductFormInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateProduct(id, data);
    revalidatePath("/admin/products");
    revalidatePath(`/products/${data.slug}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteProduct(id);
    revalidatePath("/admin/products");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}
