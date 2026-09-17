// components/checkout/checkout-flow.tsx
"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { LockKeyhole } from "lucide-react";
import {
  ShippingStep,
  type ShippingAddressForm,
  type AddressOption,
  type ShippingQuoteData,
} from "./shipping-step";
import { PaymentStep, type PaymentMethod } from "./payment-step";

export type CheckoutItem = {
  id: string;
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  image: string | null;
  quantity: number;
  unitPrice: number;
};

type Step = "shipping" | "payment";

export type CheckoutState = {
  shippingAddress: ShippingAddressForm | null;
  guestEmail: string;
  couponId?: string;
  couponCode?: string;
  discountAmount: number;
  shippingFee?: number;
  shippingQuote?: ShippingQuoteData;
  placedOrderNumber?: string;
  paymentMethod?: PaymentMethod;
};

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function CheckoutFlow({
  isLoggedIn,
  userEmail,
  initialAddresses,
  items,
  subtotal,
}: {
  isLoggedIn: boolean;
  userEmail: string | null;
  initialAddresses: AddressOption[];
  items: CheckoutItem[];
  subtotal: number;
}) {
  const [step, setStep] = useState<Step>("shipping");
  const [state, setState] = useState<CheckoutState>({
    shippingAddress: null,
    guestEmail: userEmail ?? "",
    discountAmount: 0,
  });

  const steps: { key: Step; label: string }[] = [
    { key: "shipping", label: "Giao hàng" },
    { key: "payment", label: "Thanh toán" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);
  const handleSummaryChange = useCallback(
    (summary: {
      discountAmount: number;
      couponId?: string;
      couponCode?: string;
      shippingFee?: number;
    }) => {
      setState((prev) => ({
        ...prev,
        discountAmount: summary.discountAmount,
        couponCode: summary.couponCode,
        couponId: summary.couponId,
        shippingFee: summary.shippingFee,
      }));
    },
    []
  );

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-12 md:px-10 md:py-20">
      <div className="mb-12 flex items-end justify-between border-b border-border pb-7">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Thanh toán an toàn
          </p>
          <h1 className="mt-3 font-hand text-5xl font-bold uppercase tracking-tight text-foreground md:text-7xl">
            Checkout
          </h1>
        </div>
        <LockKeyhole
          className="mb-2 size-5 text-muted-foreground"
          strokeWidth={1.5}
          aria-label="Thanh toán an toàn"
        />
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {/* Bộ đếm bước */}
          <div className="mb-10 flex items-center gap-2 font-mono text-xs">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center border ${
                    step === s.key
                      ? "border-accent text-accent"
                      : currentIndex > i
                        ? "border-foreground text-foreground"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={
                    step === s.key ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <span className="mx-1 h-px w-8 bg-border" />
                )}
              </div>
            ))}
          </div>

          {step === "shipping" && (
            <ShippingStep
              isLoggedIn={isLoggedIn}
              initialAddresses={initialAddresses}
              defaultGuestEmail={state.guestEmail}
              onContinue={(address, guestEmail, shippingQuote) => {
                setState((prev) => ({
                  ...prev,
                  shippingAddress: address,
                  guestEmail: guestEmail ?? prev.guestEmail,
                  shippingQuote,
                }));
                setStep("payment");
              }}
            />
          )}

          {step === "payment" && state.shippingAddress && (
            <PaymentStep
              subtotal={subtotal}
              shippingAddress={state.shippingAddress}
              initialQuote={state.shippingQuote}
              guestEmail={isLoggedIn ? undefined : state.guestEmail}
              onBack={() => setStep("shipping")}
              onSummaryChange={handleSummaryChange}
            />
          )}
        </div>

        {/* Sidebar tóm tắt đơn hàng */}
        <aside className="h-fit border border-border p-5 lg:sticky lg:top-8">
          <h2 className="font-hand text-xl uppercase text-foreground">
            Đơn hàng của bạn
          </h2>

          <div className="mt-6 flex flex-col divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 py-4 text-xs first:pt-0">
                <div className="relative size-16 shrink-0 overflow-hidden bg-card">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 justify-between gap-3 uppercase">
                  <span>
                    {item.productName}
                    <br />
                    <span className="text-muted-foreground normal-case">
                      {[item.size, item.color].filter(Boolean).join(" · ")} ×{" "}
                      {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono normal-case">
                    {fmt.format(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-mono">{fmt.format(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí ship</span>
              <span className="font-mono">
                {state.shippingFee === undefined
                  ? "Tính ở bước Thanh toán"
                  : state.shippingFee === 0
                    ? "Miễn phí"
                    : fmt.format(state.shippingFee)}
              </span>
            </div>
            {state.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Giảm giá ({state.couponCode})
                </span>
                <span className="font-mono">
                  −{fmt.format(state.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 font-hand text-lg uppercase text-foreground">
              <span>Tổng cộng</span>
              <span>
                {fmt.format(
                  subtotal - state.discountAmount + (state.shippingFee ?? 0)
                )}
              </span>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
            <LockKeyhole className="size-3.5" strokeWidth={1.6} />
            Thanh toán được bảo mật
          </p>
        </aside>
      </div>
    </main>
  );
}
