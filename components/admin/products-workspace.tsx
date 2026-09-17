"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AdminButton, Panel, StatusPill } from "@/components/admin/ui";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  basePrice: number;
  categoryName: string;
  image: string | null;
  totalStock: number;
  updatedAt: string;
};

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
const statusLabel: Record<ProductRow["status"], string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đang bán",
  ARCHIVED: "Đã ẩn",
};
const statusStyle: Record<ProductRow["status"], string> = {
  DRAFT: "border-amber-400/40 text-amber-300",
  PUBLISHED: "border-emerald-400/40 text-emerald-300",
  ARCHIVED: "border-border text-muted-foreground",
};
const PAGE_SIZE = 8;

export function ProductsWorkspace({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả danh mục");
  const [status, setStatus] = useState("Tất cả trạng thái");
  const [stockFilter, setStockFilter] = useState("Tất cả tồn kho");
  const [sort, setSort] = useState("Cập nhật mới nhất");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const categories = [
    "Tất cả danh mục",
    ...Array.from(new Set(products.map((product) => product.categoryName))),
  ];
  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const matchesQuery = `${product.name} ${product.slug}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory =
        category === "Tất cả danh mục" || product.categoryName === category;
      const matchesStatus =
        status === "Tất cả trạng thái" ||
        statusLabel[product.status] === status;
      const matchesStock =
        stockFilter === "Tất cả tồn kho" ||
        (stockFilter === "Còn hàng"
          ? product.totalStock > 0
          : product.totalStock === 0);
      return matchesQuery && matchesCategory && matchesStatus && matchesStock;
    });
    return [...result].sort((first, second) =>
      sort === "Giá cao"
        ? second.basePrice - first.basePrice
        : sort === "Giá thấp"
          ? first.basePrice - second.basePrice
          : sort === "Tên A-Z"
            ? first.name.localeCompare(second.name)
            : second.updatedAt.localeCompare(first.updatedAt),
    );
  }, [products, query, category, status, stockFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allVisibleSelected =
    visible.length > 0 &&
    visible.every((product) => selected.includes(product.id));

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelected((current) =>
        current.filter((id) => !visible.some((product) => product.id === id)),
      );
      return;
    }

    setSelected((current) => {
      const merged = new Set(current);
      visible.forEach((product) => merged.add(product.id));
      return Array.from(merged);
    });
  }

  function handleBulkAction(action: string) {
    window.alert(
      `"${action}" cho ${selected.length} sản phẩm — chưa nối logic thật, sẽ làm ở bước sau.`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border border-border bg-foreground/2 p-3 lg:flex-row">
        <label className="flex flex-1 items-center gap-2 border border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm sản phẩm, slug..."
            className="w-full bg-transparent py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </label>
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground"
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground"
        >
          <option>Tất cả trạng thái</option>
          <option>Nháp</option>
          <option>Đang bán</option>
          <option>Đã ẩn</option>
        </select>
        <select
          value={stockFilter}
          onChange={(event) => {
            setStockFilter(event.target.value);
            setPage(1);
          }}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground"
        >
          <option>Tất cả tồn kho</option>
          <option>Còn hàng</option>
          <option>Hết hàng</option>
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="border border-border bg-background px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-foreground"
        >
          <option>Cập nhật mới nhất</option>
          <option>Giá cao</option>
          <option>Giá thấp</option>
          <option>Tên A-Z</option>
        </select>
        <Link href="/admin/products/new">
          <AdminButton>
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Thêm sản phẩm
          </AdminButton>
        </Link>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border border-primary/30 bg-primary p-3 text-primary-foreground">
          <span className="mr-auto text-[10px] uppercase tracking-[0.15em]">
            {selected.length} đã chọn
          </span>
          <button
            type="button"
            onClick={() => handleBulkAction("Đăng bán")}
            className="px-2 py-1 text-[10px] uppercase hover:bg-black/10"
          >
            Đăng bán
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction("Chuyển nháp")}
            className="px-2 py-1 text-[10px] uppercase hover:bg-black/10"
          >
            Chuyển nháp
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction("Lưu trữ")}
            className="px-2 py-1 text-[10px] uppercase hover:bg-black/10"
          >
            <Archive className="mr-1 inline h-3 w-3" />
            Lưu trữ
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction("Xoá")}
            className="px-2 py-1 text-[10px] uppercase hover:bg-black/10"
          >
            <Trash2 className="mr-1 inline h-3 w-3" />
            Xoá
          </button>
        </div>
      )}

      <Panel
        title="Danh mục sản phẩm"
        meta={`${filtered.length} / ${products.length} sản phẩm`}
      >
        <div className="hidden grid-cols-[28px_2.5fr_1fr_0.8fr_0.8fr_1fr_1fr] gap-4 border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 md:grid">
          <span>
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
            />
          </span>
          <span>Sản phẩm</span>
          <span>Danh mục</span>
          <span>Giá</span>
          <span>Tồn kho</span>
          <span>Cập nhật</span>
          <span className="text-right">Trạng thái</span>
        </div>
        <div className="divide-y divide-border">
          {visible.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-2 gap-4 px-5 py-4 text-[13px] md:grid-cols-[28px_2.5fr_1fr_0.8fr_0.8fr_1fr_1fr] md:items-center"
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(product.id)
                        ? current.filter((id) => id !== product.id)
                        : [...current, product.id],
                    )
                  }
                />
              </div>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex items-center gap-3 text-left"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-foreground/10">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-hand tracking-wide text-foreground">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {product.slug}
                  </p>
                </div>
              </Link>
              <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                {product.categoryName}
              </span>
              <span className="font-hand text-foreground">
                {fmt.format(product.basePrice)}
              </span>
              <span
                className={
                  product.totalStock ? "text-foreground" : "text-red-300"
                }
              >
                {product.totalStock || "Hết"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(product.updatedAt).toLocaleDateString("vi-VN")}
              </span>
              <div className="text-right">
                <StatusPill className={statusStyle[product.status]}>
                  {statusLabel[product.status]}
                </StatusPill>
              </div>
            </div>
          ))}
        </div>
        {visible.length === 0 && (
          <div className="px-5 py-12 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground/70">
            Không có sản phẩm nào khớp bộ lọc.
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Trang trước"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="border border-border p-2 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Trang sau"
              disabled={page === totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="border border-border p-2 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
