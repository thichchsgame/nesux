import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ProductsWorkspace } from "@/components/admin/products-workspace";
import { listProductsForAdmin } from "@/lib/products";

export default async function AdminProductsPage() {
  const { products } = await listProductsForAdmin({ pageSize: 1000 });
  const rows = products.map((product) => ({
    ...product,
    updatedAt: product.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Sản phẩm" crumb="Products" />
      <ProductsWorkspace products={rows} />
    </div>
  );
}
