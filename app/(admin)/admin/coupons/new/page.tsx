import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Panel } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/coupon-form";

export default function NewCouponPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar title="Tạo mã giảm giá" crumb="Coupons / New" />
      <Link
        href="/admin/coupons"
        className="flex w-fit items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
      </Link>
      <Panel title="Thông tin mã">
        <div className="p-5">
          <CouponForm />
        </div>
      </Panel>
    </div>
  );
}
