// app/checkout/address-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as addresses from "@/lib/addresses";

type ActionResult = { ok: true } | { ok: false; error: string };

type AddressFormData = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  ward?: string;
  district?: string;
  city: string;
  postalCode?: string;
  isDefault?: boolean;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Bạn cần đăng nhập để dùng sổ địa chỉ.");
  return session.user.id;
}

export async function createAddressAction(data: AddressFormData): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.createAddress(userId, data);
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function updateAddressAction(addressId: string, data: AddressFormData): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.updateAddress(addressId, userId, data);
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.deleteAddress(addressId, userId);
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.setDefaultAddress(addressId, userId);
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}