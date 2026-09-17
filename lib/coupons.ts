// lib/coupons.ts
import "server-only";
import { prisma } from "@/lib/prisma";

type CouponValidationResult =
  | { ok: true; couponId: string; couponCode: string; discountAmount: number }
  | { ok: false; error: string };

export async function validateCoupon(
  code: string,
  subtotal: number,
  userId?: string
): Promise<CouponValidationResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon) return { ok: false, error: "Mã giảm giá không tồn tại." };
  if (!coupon.isActive) return { ok: false, error: "Mã giảm giá không còn hiệu lực." };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    return { ok: false, error: "Mã giảm giá chưa bắt đầu." };
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { ok: false, error: "Mã giảm giá đã hết hạn." };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "Mã giảm giá đã hết lượt sử dụng." };
  }

  if (coupon.usageLimitPerUser !== null) {
    if (!userId) {
      // Guest không track được lịch sử dùng coupon theo user → coupon giới hạn/user
      // bắt buộc phải đăng nhập mới áp dụng được. Đây là giới hạn hợp lý, không phải bug.
      return { ok: false, error: "Mã giảm giá này yêu cầu đăng nhập để sử dụng." };
    }
    const usedByUser = await prisma.order.count({
      where: { userId, couponId: coupon.id, status: { not: "CANCELLED" } },
    });
    if (usedByUser >= coupon.usageLimitPerUser) {
      return { ok: false, error: "Bạn đã dùng hết lượt cho mã giảm giá này." };
    }
  }

  if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
    const fmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
    return { ok: false, error: `Đơn hàng cần tối thiểu ${fmt.format(Number(coupon.minOrderAmount))} để dùng mã này.` };
  }

  let discountAmount =
    coupon.type === "PERCENTAGE" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);

  if (coupon.maxDiscountAmount !== null) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }
  discountAmount = Math.min(discountAmount, subtotal); // không để discount vượt quá subtotal → total âm

  return {
    ok: true,
    couponId: coupon.id,
    couponCode: coupon.code,
    discountAmount: Math.round(discountAmount),
  };
}

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getCouponById(id: string) {
  return prisma.coupon.findUnique({ where: { id } });
}

type CouponInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive: boolean;
};

function validateCouponInput(data: CouponInput): string | null {
  if (!data.code.trim()) return "Vui lòng nhập mã.";
  if (data.value <= 0) return "Giá trị giảm giá phải lớn hơn 0.";
  if (data.type === "PERCENTAGE" && data.value > 100) return "Phần trăm giảm không được vượt quá 100.";
  return null;
}

export async function createCoupon(data: CouponInput) {
  const error = validateCouponInput(data);
  if (error) throw new Error(error);

  const code = data.code.trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw new Error("Mã này đã tồn tại.");

  return prisma.coupon.create({
    data: {
      code,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount ?? undefined,
      maxDiscountAmount: data.maxDiscountAmount ?? undefined,
      usageLimit: data.usageLimit ?? undefined,
      usageLimitPerUser: data.usageLimitPerUser ?? undefined,
      startsAt: data.startsAt ?? undefined,
      expiresAt: data.expiresAt ?? undefined,
      isActive: data.isActive,
    },
  });
}

export async function updateCoupon(id: string, data: CouponInput) {
  const error = validateCouponInput(data);
  if (error) throw new Error(error);

  const code = data.code.trim().toUpperCase();
  const existing = await prisma.coupon.findFirst({ where: { code, NOT: { id } } });
  if (existing) throw new Error("Mã này đã được dùng bởi coupon khác.");

  return prisma.coupon.update({
    where: { id },
    data: {
      code,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount ?? undefined,
      maxDiscountAmount: data.maxDiscountAmount ?? undefined,
      usageLimit: data.usageLimit ?? undefined,
      usageLimitPerUser: data.usageLimitPerUser ?? undefined,
      startsAt: data.startsAt ?? undefined,
      expiresAt: data.expiresAt ?? undefined,
      isActive: data.isActive,
    },
  });
}

export async function deleteCoupon(id: string) {
  // Coupon đã có Order tham chiếu (Order.couponId) — không xoá thật, chỉ tắt isActive,
  // vì Order cũ cần giữ nguyên liên kết để tra cứu lịch sử (couponCode đã snapshot sẵn
  // trên Order nên dù xoá Coupon gốc cũng không ảnh hưởng hiển thị đơn cũ — nhưng xoá
  // hẳn dễ gây nhầm lẫn khi admin tra cứu báo cáo, nên tắt thay vì xoá là lựa chọn an toàn hơn).
  const used = await prisma.order.findFirst({ where: { couponId: id } });
  if (used) {
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    return { deactivated: true };
  }
  await prisma.coupon.delete({ where: { id } });
  return { deactivated: false };
}