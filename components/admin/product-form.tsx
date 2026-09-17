"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Trash2, X } from "lucide-react";
import { AdminButton, StatusPill } from "@/components/admin/ui";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/app/(admin)/admin/products/actions";

type Variant = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  priceOverride: string;
  stock: string;
};

type Category = { id: string; name: string };

type ProductFormData = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  basePrice: string;
  compareAtPrice: string;
  heroTagline: string;
  categoryId: string;
  imageUrls: string[];
  variants: Variant[];
  tags: string[];
  updatedAt?: string;
};

const inputClass =
  "w-full border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none transition-colors focus:border-foreground/40";
const selectClass = `${inputClass} appearance-none cursor-pointer`;
const labelClass =
  "mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground";
const statusStyle: Record<string, string> = {
  DRAFT: "border-amber-400/40 text-amber-300",
  PUBLISHED: "border-emerald-400/40 text-emerald-300",
  ARCHIVED: "border-border text-muted-foreground",
};

function emptyVariant(): Variant {
  return {
    sku: "",
    size: "",
    color: "",
    colorHex: "#1a1a1a",
    priceOverride: "",
    stock: "0",
  };
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-border p-5 ${className}`}>
      <h3 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function ProductForm({
  categories,
  initialData,
}: {
  categories: Category[];
  initialData?: ProductFormData;
}) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [form, setForm] = useState<ProductFormData>(
    initialData ?? {
      name: "",
      slug: "",
      description: "",
      status: "DRAFT",
      basePrice: "",
      compareAtPrice: "",
      heroTagline: "",
      categoryId: categories[0]?.id ?? "",
      imageUrls: [""],
      variants: [emptyVariant()],
      tags: [],
    },
  );
  const [tagsInput, setTagsInput] = useState(form.tags.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateVariant(index: number, patch: Partial<Variant>) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, ...patch } : v,
      ),
    }));
  }

  function handleSave() {
    setError(null);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      status: form.status,
      basePrice: Number(form.basePrice),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      heroTagline: form.heroTagline.trim() || null,
      categoryId: form.categoryId,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      imageUrls: form.imageUrls.filter((u) => u.trim()),
      variants: form.variants
        .filter((v) => v.sku.trim())
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size || null,
          color: v.color || null,
          colorHex: v.colorHex || null,
          priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
          stock: Number(v.stock),
        })),
    };

    startTransition(async () => {
      const res = isEditing
        ? await updateProductAction(initialData!.id!, payload)
        : await createProductAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/products");
    });
  }

  function handleDelete() {
    if (!isEditing || !confirm("Xoá sản phẩm này?")) return;
    startTransition(async () => {
      const res = await deleteProductAction(initialData!.id!);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/products");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Thông tin cơ bản">
          <label>
            <span className={labelClass}>Tên sản phẩm</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Slug</span>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Hero tagline (tuỳ chọn)</span>
            <input
              value={form.heroTagline}
              onChange={(e) =>
                setForm({ ...form, heroTagline: e.target.value })
              }
              placeholder="VD: Water / Wind / City"
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Mô tả</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className={inputClass}
            />
          </label>
        </Section>

        <Section title="Trạng thái & phân loại">
          <label>
            <span className={labelClass}>Trạng thái</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as ProductFormData["status"],
                })
              }
              className={selectClass}
            >
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Đang bán</option>
              <option value="ARCHIVED">Đã ẩn</option>
            </select>
          </label>
          <div className="mt-1">
            <StatusPill className={statusStyle[form.status]}>
              {form.status === "DRAFT"
                ? "Nháp"
                : form.status === "PUBLISHED"
                  ? "Đang bán"
                  : "Đã ẩn"}
            </StatusPill>
          </div>
          <label>
            <span className={labelClass}>Danh mục</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={selectClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {form.updatedAt && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
              Cập nhật lần cuối:{" "}
              {new Date(form.updatedAt).toLocaleString("vi-VN")}
            </p>
          )}
        </Section>

        <Section title="Ảnh sản phẩm">
          <div className="grid grid-cols-3 gap-2">
            {form.imageUrls.map((url, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden border border-border bg-foreground/[0.03]"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground/60">
                    Chưa có URL
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      imageUrls: form.imageUrls.filter((_, j) => j !== i),
                    })
                  }
                  className="absolute right-1 top-1 bg-background/80 p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                <input
                  value={url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      imageUrls: form.imageUrls.map((u, j) =>
                        j === i ? e.target.value : u,
                      ),
                    })
                  }
                  placeholder="Dán URL..."
                  className="absolute inset-x-0 bottom-0 bg-background/90 px-1.5 py-1 text-[10px] text-foreground outline-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm({ ...form, imageUrls: [...form.imageUrls, ""] })
              }
              className="flex aspect-square items-center justify-center border border-dashed border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Dán URL ảnh trực tiếp — upload thật (R2) để dành sau.
          </p>
        </Section>

        <Section title="Giá & tồn kho tổng">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>Giá bán</span>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) =>
                  setForm({ ...form, basePrice: e.target.value })
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Giá gốc (sale)</span>
              <input
                type="number"
                value={form.compareAtPrice}
                onChange={(e) =>
                  setForm({ ...form, compareAtPrice: e.target.value })
                }
                className={inputClass}
              />
            </label>
          </div>
        </Section>

        <Section
          title="Biến thể (size / màu / tồn kho)"
          className="md:col-span-2"
        >
          <div className="flex flex-col gap-3">
            {form.variants.map((v, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-2 border-b border-border pb-4 last:border-0 md:grid-cols-6 md:items-end"
              >
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Size"
                  value={v.size}
                  onChange={(e) => updateVariant(i, { size: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Màu"
                  value={v.color}
                  onChange={(e) => updateVariant(i, { color: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="color"
                  value={v.colorHex}
                  onChange={(e) =>
                    updateVariant(i, { colorHex: e.target.value })
                  }
                  className="h-10 w-full border border-border bg-background"
                />
                <input
                  type="number"
                  placeholder="Tồn kho"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: e.target.value })}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      variants: form.variants.filter((_, j) => j !== i),
                    })
                  }
                  className="flex items-center justify-center gap-1 border border-destructive/30 py-2 text-[11px] text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Xoá
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  variants: [...form.variants, emptyVariant()],
                })
              }
              className="self-start text-[11px] uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              + Thêm biến thể
            </button>
          </div>
        </Section>

        <Section title="Thẻ (tags)" className="md:col-span-2">
          <label>
            <span className={labelClass}>Tags, cách nhau bằng dấu phẩy</span>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: utility, mùa đông, giới hạn"
              className={inputClass}
            />
          </label>
        </Section>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <AdminButton onClick={handleSave}>
          <Check className="h-4 w-4" />
          {isPending ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo sản phẩm"}
        </AdminButton>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2 border border-destructive/30 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Xoá sản phẩm
          </button>
        )}
      </div>
    </div>
  );
}
