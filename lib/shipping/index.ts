import "server-only";
import { prisma } from "@/lib/prisma";
import { GhnProvider } from "./ghn";
export { getWardOptions } from "./ghn";
import type {
  ShippingDestination,
  ShippingOrderInput,
  ShippingOrderResult,
  ShippingQuote,
} from "./types";
export type {
  ShippingDestination,
  ShippingOrderInput,
  ShippingOrderResult,
  ShippingQuote,
} from "./types";
export {
  computeCustomerShippingFee,
  computeExpressFee,
  EXPRESS_MIN_FEE,
  EXPRESS_SURCHARGE,
  type ShippingMethodCode,
} from "./rules";
const provider = new GhnProvider();
export function getShippingQuote(
  destination: ShippingDestination,
  weightGrams: number,
): Promise<ShippingQuote> {
  return provider.calculateFee(destination, weightGrams);
}
export function createShippingOrder(
  input: ShippingOrderInput,
): Promise<ShippingOrderResult> {
  return provider.createOrder(input);
}
export async function getFreeShipThreshold(): Promise<number> {
  return (
    (await prisma.shippingSetting.findFirst())?.freeShipThreshold ?? 1_000_000
  );
}
