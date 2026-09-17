import Link from "next/link";
import { Plus } from "lucide-react";
import { listCoupons } from "@/lib/coupons";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminButton } from "@/components/admin/ui";
import { CouponsWorkspace } from "@/components/admin/coupons-workspace";

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();

  const rows = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount !== null ? Number(c.minOrderAmount) : null,
    maxDiscountAmount:
      c.maxDiscountAmount !== null ? Number(c.maxDiscountAmount) : null,
    usageLimit: c.usageLimit,
    usageLimitPerUser: c.usageLimitPerUser,
    usedCount: c.usedCount,
    isActive: c.isActive,
    startsAt: c.startsAt ? c.startsAt.toISOString() : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
  }));

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar
        title="Mã giảm giá"
        crumb="Coupons"
        action={
          <Link href="/admin/coupons/new">
            <AdminButton>
              <Plus className="h-4 w-4" strokeWidth={1.5} /> Tạo mã mới
            </AdminButton>
          </Link>
        }
      />
      <CouponsWorkspace coupons={rows} />
    </div>
  );
}
