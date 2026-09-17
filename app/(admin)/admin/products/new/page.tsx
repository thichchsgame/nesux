import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Thêm sản phẩm mới" crumb="Products / New" />
      <ProductForm categories={categories} />
    </div>
  );
}
