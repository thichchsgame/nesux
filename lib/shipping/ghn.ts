import "server-only";
import type {
  ShippingDestination,
  ShippingOrderInput,
  ShippingOrderResult,
  ShippingProvider,
  ShippingQuote,
} from "./types";
const GHN_API_BASE =
  process.env.GHN_API_BASE ?? "https://dev-online-gateway.ghn.vn";
const GHN_TOKEN = process.env.GHN_TOKEN!;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID!;
const GHN_FROM_DISTRICT_ID = Number(process.env.GHN_FROM_DISTRICT_ID);
const GHN_FROM_WARD_CODE = process.env.GHN_FROM_WARD_CODE!;
type GhnProvince = { ProvinceID: number; ProvinceName: string };
type GhnDistrict = { DistrictID: number };
type GhnWard = { WardCode: string; WardName: string };
const GHN_REQUIRED_NOTE = "CHOXEMHANGKHONGTHU";
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(xa|phuong|thi tran|tt|tp\.?|thanh pho|tinh)\s+/i, "")
    .trim();
}
async function ghnFetch<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  if (
    !GHN_TOKEN ||
    !GHN_SHOP_ID ||
    !Number.isFinite(GHN_FROM_DISTRICT_ID) ||
    !GHN_FROM_WARD_CODE
  )
    throw new Error("Thiếu cấu hình GHN.");
  const response = await fetch(`${GHN_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Token: GHN_TOKEN,
      ShopId: GHN_SHOP_ID,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await response.json();
  if (!response.ok || json.code !== 200)
    throw new Error(`GHN error: ${json.message ?? "unknown"}`);
  return json.data as T;
}
let provinces: GhnProvince[] | null = null;
const districts = new Map<number, GhnDistrict[]>();
const wards = new Map<number, GhnWard[]>();
async function resolveGhnLocation(destination: ShippingDestination) {
  provinces ??= await ghnFetch<GhnProvince[]>(
    "/shiip/public-api/master-data/province",
  );
  const province = provinces.find(
    (item) =>
      normalize(item.ProvinceName) === normalize(destination.provinceName),
  );
  if (!province)
    throw new Error("Không tìm thấy tỉnh/thành trong dữ liệu GHN.");
  if (!districts.has(province.ProvinceID))
    districts.set(
      province.ProvinceID,
      await ghnFetch("/shiip/public-api/master-data/district", {
        province_id: province.ProvinceID,
      }),
    );
  for (const district of districts.get(province.ProvinceID)!) {
    if (!wards.has(district.DistrictID))
      wards.set(
        district.DistrictID,
        await ghnFetch("/shiip/public-api/master-data/ward", {
          district_id: district.DistrictID,
        }),
      );
    const ward = wards
      .get(district.DistrictID)!
      .find(
        (item) => normalize(item.WardName) === normalize(destination.wardName),
      );
    if (ward)
      return { districtId: district.DistrictID, wardCode: ward.WardCode };
  }
  throw new Error("Không tìm thấy xã/phường trong dữ liệu GHN.");
}
export async function getWardOptions(provinceName: string): Promise<string[]> {
  provinces ??= await ghnFetch<GhnProvince[]>(
    "/shiip/public-api/master-data/province",
  );
  const province = provinces.find(
    (item) => normalize(item.ProvinceName) === normalize(provinceName),
  );
  if (!province)
    throw new Error("Không tìm thấy tỉnh/thành trong dữ liệu GHN.");
  if (!districts.has(province.ProvinceID))
    districts.set(
      province.ProvinceID,
      await ghnFetch("/shiip/public-api/master-data/district", {
        province_id: province.ProvinceID,
      }),
    );
  const wardLists = await Promise.all(
    (districts.get(province.ProvinceID) ?? []).map(async (district) => {
      if (!wards.has(district.DistrictID))
        wards.set(
          district.DistrictID,
          await ghnFetch("/shiip/public-api/master-data/ward", {
            district_id: district.DistrictID,
          }),
        );
      return wards.get(district.DistrictID)!;
    }),
  );
  return [...new Set(wardLists.flat().map((ward) => ward.WardName))].sort(
    (a, b) => a.localeCompare(b, "vi"),
  );
}

export class GhnProvider implements ShippingProvider {
  readonly name = "GHN" as const;
  async calculateFee(
    destination: ShippingDestination,
    weightGrams: number,
  ): Promise<ShippingQuote> {
    const { districtId, wardCode } = await resolveGhnLocation(destination);
    const fee = await ghnFetch<{ total: number }>(
      "/shiip/public-api/v2/shipping-order/fee",
      {
        service_type_id: 2,
        from_district_id: GHN_FROM_DISTRICT_ID,
        from_ward_code: GHN_FROM_WARD_CODE,
        to_district_id: districtId,
        to_ward_code: wardCode,
        weight: weightGrams,
        height: 20,
        length: 30,
        width: 40,
        insurance_value: 0,
      },
    );
    return { carrierFee: fee.total, provider: "GHN" };
  }

  async createOrder(input: ShippingOrderInput): Promise<ShippingOrderResult> {
    const { districtId, wardCode } = await resolveGhnLocation(
      input.destination,
    );
    const result = await ghnFetch<{
      order_code: string;
      expected_delivery_time?: string;
    }>("/shiip/public-api/v2/shipping-order/create", {
      payment_type_id: 1,
      required_note: GHN_REQUIRED_NOTE,
      client_order_code: input.clientOrderCode,
      to_name: input.toName,
      to_phone: input.toPhone,
      to_address: input.toAddress,
      to_ward_code: wardCode,
      to_district_id: districtId,
      from_district_id: GHN_FROM_DISTRICT_ID,
      from_ward_code: GHN_FROM_WARD_CODE,
      weight: input.weightGrams,
      length: 30,
      width: 40,
      height: 20,
      service_type_id: 2,
      cod_amount: input.codAmount,
      items: input.items.map((item) => ({
        name: item.name,
        code: item.code,
        quantity: item.quantity,
        price: item.price,
      })),
    });
    return {
      trackingCode: result.order_code,
      expectedDeliveryTime: result.expected_delivery_time,
    };
  }
}
