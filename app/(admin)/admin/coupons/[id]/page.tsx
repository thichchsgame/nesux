import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCouponById } from "@/lib/coupons";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Panel } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupon-form";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getCouponById(id);
  if (!coupon) notFound();

  const initialData = {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.value),
    minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
    maxDiscountAmount: coupon.maxDiscountAmount
      ? String(coupon.maxDiscountAmount)
      : "",
    usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
    usageLimitPerUser: coupon.usageLimitPerUser
      ? String(coupon.usageLimitPerUser)
      : "",
    startsAt: coupon.startsAt ? coupon.startsAt.toISOString().slice(0, 10) : "",
    expiresAt: coupon.expiresAt
      ? coupon.expiresAt.toISOString().slice(0, 10)
      : "",
    isActive: coupon.isActive,
  };

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Sửa mã giảm giá" crumb={`Coupons / ${coupon.code}`} />
      <Link
        href="/admin/coupons"
        className="flex w-fit items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
      </Link>
      <Panel title="Thông tin mã" meta={`Đã dùng ${coupon.usedCount} lần`}>
        <div className="p-5">
          <CouponForm initialData={initialData} />
        </div>
      </Panel>
    </div>
  );
}
