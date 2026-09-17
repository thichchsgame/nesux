"use server";
import { auth } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import {
  getFreeShipThreshold,
  getShippingQuote,
  getWardOptions,
} from "@/lib/shipping";
type QuoteResult =
  | {
      ok: true;
      carrierFee: number;
      freeShipThreshold: number;
      estimatedDays?: number;
    }
  | { ok: false; error: string };
export async function getShippingQuoteAction(address: {
  city: string;
  ward?: string;
}): Promise<QuoteResult> {
  if (!address.city || !address.ward)
    return {
      ok: false,
      error: "Thiếu Tỉnh/Thành hoặc Xã/Phường để tính phí vận chuyển.",
    };
  const session = await auth();
  const cart = await getOrCreateCart(session?.user?.id);
  if (!cart.items.length) return { ok: false, error: "Giỏ hàng trống." };
  const weight = cart.items.reduce(
    (total, item) => total + item.variant.weightGrams * item.quantity,
    0,
  );
  try {
    const [quote, freeShipThreshold] = await Promise.all([
      getShippingQuote(
        { provinceName: address.city, wardName: address.ward },
        weight,
      ),
      getFreeShipThreshold(),
    ]);
    return {
      ok: true,
      carrierFee: quote.carrierFee,
      freeShipThreshold,
      estimatedDays: quote.estimatedDays,
    };
  } catch (error) {
    console.error("Không thể tính phí GHN:", error);
    return {
      ok: false,
      error: "Không thể tính phí vận chuyển lúc này. Vui lòng thử lại.",
    };
  }
}

export async function getWardOptionsAction(
  provinceName: string,
): Promise<{ ok: true; wards: string[] } | { ok: false; error: string }> {
  if (!provinceName) return { ok: false, error: "Chưa chọn Tỉnh/Thành." };
  try {
    return { ok: true, wards: await getWardOptions(provinceName) };
  } catch (error) {
    console.error("Không thể lấy danh sách xã/phường GHN:", error);
    return {
      ok: false,
      error: "Không thể tải danh sách Xã/Phường. Vui lòng thử lại.",
    };
  }
}
