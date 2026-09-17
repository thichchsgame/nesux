"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as addresses from "@/lib/addresses";

type ActionResult = { ok: true } | { ok: false; error: string };

type AddressFormInput = {
  fullName: string;
  phone: string;
  line1: string;
  ward?: string;
  city: string;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập.");
  if (session.user.suspended) throw new Error("Tài khoản của bạn hiện không thể thực hiện thao tác này.");
  return session.user.id;
}

export async function createAddressAction(data: AddressFormInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.createAddress(userId, data);
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function updateAddressAction(addressId: string, data: AddressFormInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.updateAddress(addressId, userId, data);
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.deleteAddress(addressId, userId);
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await addresses.setDefaultAddress(addressId, userId);
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Có lỗi xảy ra." };
  }
}
