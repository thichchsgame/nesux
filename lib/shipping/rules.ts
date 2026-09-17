export type ShippingMethodCode = "STANDARD" | "EXPRESS";

// Express is a NEXUS business rule, not a separate GHN service. It must never
// cost less than standard delivery.
export const EXPRESS_MIN_FEE = 60_000;
export const EXPRESS_SURCHARGE = 25_000;
/** @deprecated Use computeExpressFee with the current GHN carrier fee. */
export const EXPRESS_SHIPPING_FEE = EXPRESS_MIN_FEE;

export function computeExpressFee(standardFee: number): number {
  return Math.max(EXPRESS_MIN_FEE, standardFee + EXPRESS_SURCHARGE);
}

export function computeCustomerShippingFee(params: {
  method: ShippingMethodCode;
  carrierFee: number;
  discountedSubtotal: number;
  freeShipThreshold: number;
}): { customerFee: number; freeShipApplied: boolean } {
  if (params.method === "EXPRESS") return { customerFee: computeExpressFee(params.carrierFee), freeShipApplied: false };
  const freeShipApplied = params.discountedSubtotal >= params.freeShipThreshold;
  return { customerFee: freeShipApplied ? 0 : params.carrierFee, freeShipApplied };
}
