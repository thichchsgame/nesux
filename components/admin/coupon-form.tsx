"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/components/admin/ui";
import {
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
} from "@/app/(admin)/admin/coupons/actions";

type CouponFormData = {
  id?: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  usageLimitPerUser: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const inputClass =
  "w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-foreground/40";
const selectClass = `${inputClass} appearance-none cursor-pointer`;
const labelClass =
  "mb-2 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground";

export function CouponForm({ initialData }: { initialData?: CouponFormData }) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [form, setForm] = useState<CouponFormData>(
    initialData ?? {
      code: "",
      type: "PERCENTAGE",
      value: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      usageLimit: "",
      usageLimitPerUser: "",
      startsAt: "",
      expiresAt: "",
      isActive: true,
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxDiscountAmount: form.maxDiscountAmount
        ? Number(form.maxDiscountAmount)
        : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      usageLimitPerUser: form.usageLimitPerUser
        ? Number(form.usageLimitPerUser)
        : null,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
    };

    startTransition(async () => {
      const res = isEditing
        ? await updateCouponAction(initialData!.id!, payload)
        : await createCouponAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/coupons");
    });
  }

  function handleDelete() {
    if (!isEditing || !confirm("Xoá mã giảm giá này?")) return;
    startTransition(async () => {
      const res = await deleteCouponAction(initialData!.id!);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/admin/coupons");
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Mã</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className={`${inputClass} font-hand uppercase tracking-[0.1em]`}
            placeholder="SALE10"
          />
        </div>
        <div>
          <label className={labelClass}>Loại</label>
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as never })
            }
            className={selectClass}
          >
            <option value="PERCENTAGE">Phần trăm (%)</option>
            <option value="FIXED">Số tiền cố định (đ)</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Giá trị {form.type === "PERCENTAGE" ? "(%)" : "(đ)"}
        </label>
        <input
          type="number"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Đơn tối thiểu (đ)</label>
          <input
            type="number"
            value={form.minOrderAmount}
            onChange={(e) =>
              setForm({ ...form, minOrderAmount: e.target.value })
            }
            className={inputClass}
            placeholder="Không giới hạn"
          />
        </div>
        <div>
          <label className={labelClass}>Giảm tối đa (đ)</label>
          <input
            type="number"
            value={form.maxDiscountAmount}
            onChange={(e) =>
              setForm({ ...form, maxDiscountAmount: e.target.value })
            }
            className={inputClass}
            placeholder="Không giới hạn"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tổng lượt dùng</label>
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            className={inputClass}
            placeholder="Không giới hạn"
          />
        </div>
        <div>
          <label className={labelClass}>Lượt dùng / user</label>
          <input
            type="number"
            value={form.usageLimitPerUser}
            onChange={(e) =>
              setForm({ ...form, usageLimitPerUser: e.target.value })
            }
            className={inputClass}
            placeholder="Không giới hạn"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Bắt đầu</label>
          <input
            type="date"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Hết hạn</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="h-3.5 w-3.5 border-border accent-foreground"
        />
        Kích hoạt
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <AdminButton onClick={handleSave} disabled={isPending}>
          {isPending ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mã"}
        </AdminButton>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="border border-destructive/30 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-destructive disabled:opacity-40"
          >
            Xoá
          </button>
        )}
      </div>
    </div>
  );
}
