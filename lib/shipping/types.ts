export type ShippingDestination = { provinceName: string; wardName: string };
export type ShippingQuote = {
  carrierFee: number;
  provider: "GHN";
  estimatedDays?: number;
};
export type ShippingOrderItem = {
  name: string;
  code?: string;
  quantity: number;
  price: number;
};
export type ShippingOrderInput = {
  toName: string;
  toPhone: string;
  toAddress: string;
  destination: ShippingDestination;
  weightGrams: number;
  codAmount: number;
  clientOrderCode: string;
  items: ShippingOrderItem[];
};
export type ShippingOrderResult = {
  trackingCode: string;
  expectedDeliveryTime?: string;
};
export interface ShippingProvider {
  readonly name: "GHN" | "GHTK";
  calculateFee(
    destination: ShippingDestination,
    weightGrams: number,
  ): Promise<ShippingQuote>;
  createOrder(input: ShippingOrderInput): Promise<ShippingOrderResult>;
}
