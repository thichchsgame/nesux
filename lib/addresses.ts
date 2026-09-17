// lib/addresses.ts
import "server-only";
import { prisma } from "@/lib/prisma";

type AddressInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  ward?: string | null;
  district?: string | null;
  city: string;
  postalCode?: string | null;
  country?: string;
  isDefault?: boolean;
};

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function getDefaultAddress(userId: string) {
  return prisma.address.findFirst({
    where: { userId, isDefault: true },
  });
}

async function assertOwnsAddress(addressId: string, userId: string) {
  const address = await prisma.address.findUniqueOrThrow({ where: { id: addressId } });
  if (address.userId !== userId) throw new Error("Không có quyền truy cập địa chỉ này.");
  return address;
}

function validateAddressInput(data: AddressInput): string | null {
  if (!data.fullName?.trim()) return "Vui lòng nhập họ tên.";
  if (!/^(0|\+84)\d{9,10}$/.test(data.phone?.trim() ?? "")) return "Số điện thoại không hợp lệ.";
  if (!data.line1?.trim()) return "Vui lòng nhập địa chỉ cụ thể.";
  if (!data.city?.trim()) return "Vui lòng nhập tỉnh/thành phố.";
  return null;
}

export async function createAddress(userId: string, data: AddressInput) {
  const error = validateAddressInput(data);
  if (error) throw new Error(error);

  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = data.isDefault || existingCount === 0; // địa chỉ đầu tiên tự động là mặc định

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...data, userId, isDefault: shouldBeDefault },
    });
  });
}

export async function updateAddress(addressId: string, userId: string, data: AddressInput) {
  const error = validateAddressInput(data);
  if (error) throw new Error(error);

  await assertOwnsAddress(addressId, userId);

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }
    return tx.address.update({ where: { id: addressId }, data });
  });
}

export async function deleteAddress(addressId: string, userId: string) {
  const address = await assertOwnsAddress(addressId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } });
    // nếu xoá mất địa chỉ mặc định, đôn địa chỉ mới nhất còn lại lên làm mặc định
    if (address.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
}

export async function setDefaultAddress(addressId: string, userId: string) {
  await assertOwnsAddress(addressId, userId);

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
}