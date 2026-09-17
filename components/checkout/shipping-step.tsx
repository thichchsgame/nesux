// components/checkout/shipping-step.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createAddressAction } from "@/app/(storefront)/checkout/address-actions";
import { getShippingQuoteAction, getWardOptionsAction } from "@/app/(storefront)/checkout/shipping-actions";
import { VN_PROVINCES } from "@/lib/vn-provinces";

export type AddressOption = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  ward: string | null;
  city: string;
  postalCode: string | null;
  isDefault: boolean;
};

export type ShippingAddressForm = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  ward?: string;
  city: string;
  postalCode?: string;
};

export type ShippingQuoteData = { carrierFee: number; freeShipThreshold: number; estimatedDays?: number };

const emptyForm: ShippingAddressForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  ward: "",
  city: "",
  postalCode: "",
};

const inputClass =
  "min-h-12 w-full border border-input bg-transparent px-3.5 text-[11px] text-foreground outline-none placeholder:uppercase placeholder:tracking-[0.08em] placeholder:text-muted-foreground focus:border-accent";

const selectClass = `${inputClass} appearance-none cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a8a8a%22 stroke-width=%221.6%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_14px_center] bg-[length:14px]`;

function formatAddress(a: AddressOption | ShippingAddressForm) {
  return [a.line1, a.ward, a.city].filter(Boolean).join(", ");
}

function validate(form: ShippingAddressForm): string | null {
  if (!form.fullName.trim()) return "Vui lòng nhập họ tên.";
  if (!/^(0|\+84)\d{9,10}$/.test(form.phone.trim()))
    return "Số điện thoại không hợp lệ.";
  if (!form.line1.trim()) return "Vui lòng nhập địa chỉ cụ thể.";
  if (!form.city.trim()) return "Vui lòng chọn tỉnh/thành phố.";
  if (!form.ward?.trim()) return "Vui lòng nhập Xã/Phường để tính phí vận chuyển.";
  return null;
}

export function ShippingStep({
  isLoggedIn,
  initialAddresses,
  defaultGuestEmail,
  onContinue,
}: {
  isLoggedIn: boolean;
  initialAddresses: AddressOption[];
  defaultGuestEmail: string;
  onContinue: (address: ShippingAddressForm, guestEmail?: string, quote?: ShippingQuoteData) => void;
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedId, setSelectedId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null,
  );
  const [showNewForm, setShowNewForm] = useState(addresses.length === 0);
  const [form, setForm] = useState<ShippingAddressForm>(emptyForm);
  const [guestEmail, setGuestEmail] = useState(defaultGuestEmail);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [wardOptions, setWardOptions] = useState<string[]>([]);
  const [wardError, setWardError] = useState<string | null>(null);
  const [isLoadingWards, startLoadingWards] = useTransition();
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteData | null>(null);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const [isQuoting, startQuoting] = useTransition();

  useEffect(() => {
    if (!form.city) return;
    startLoadingWards(async () => {
      setWardError(null);
      const result = await getWardOptionsAction(form.city);
      if (!result.ok) {
        setWardError(result.error);
        setWardOptions([]);
        return;
      }
      setWardOptions(result.wards);
    });
  }, [form.city]);

  const activeDestination = useMemo(() => {
    if (showNewForm || addresses.length === 0) return form.city && form.ward ? { city: form.city, ward: form.ward } : null;
    const chosen = addresses.find((address) => address.id === selectedId);
    return chosen?.city && chosen?.ward ? { city: chosen.city, ward: chosen.ward } : null;
  }, [showNewForm, addresses, selectedId, form.city, form.ward]);

  useEffect(() => {
    if (!activeDestination) return;
    startQuoting(async () => {
      setShippingQuoteError(null);
      const result = await getShippingQuoteAction(activeDestination);
      if (!result.ok) { setShippingQuoteError(result.error); setShippingQuote(null); return; }
      setShippingQuote(result);
    });
  }, [activeDestination]);

  function handleContinue() {
    setError(null);

    if (!isLoggedIn && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setError("Vui lòng nhập email hợp lệ để theo dõi đơn hàng.");
      return;
    }

    if (isLoggedIn && !showNewForm) {
      const chosen = addresses.find((a) => a.id === selectedId);
      if (!chosen) {
        setError("Vui lòng chọn hoặc thêm địa chỉ giao hàng.");
        return;
      }
      onContinue(
        {
          fullName: chosen.fullName,
          phone: chosen.phone,
          line1: chosen.line1,
          line2: chosen.line2 ?? undefined,
          ward: chosen.ward ?? undefined,
          city: chosen.city,
          postalCode: chosen.postalCode ?? undefined,
        },
        isLoggedIn ? undefined : guestEmail,
        shippingQuote ?? undefined,
      );
      return;
    }

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isLoggedIn) {
      startTransition(async () => {
        const res = await createAddressAction(form);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onContinue(form, undefined, shippingQuote ?? undefined);
      });
    } else {
      onContinue(form, guestEmail, shippingQuote ?? undefined);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-hand text-xl uppercase text-foreground">
        Địa chỉ giao hàng
      </h2>

      {!isLoggedIn && (
        <div>
          <label className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Email (để theo dõi đơn hàng)
          </label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="ban@email.com"
            className={inputClass}
          />
        </div>
      )}

      {isLoggedIn && addresses.length > 0 && !showNewForm && (
        <div className="space-y-2">
          {addresses.map((a) => (
            <label
              key={a.id}
              className={`block cursor-pointer border p-4 text-xs ${
                selectedId === a.id ? "border-accent" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                  className="mt-1 accent-foreground"
                />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {a.fullName} · {a.phone}
                    {a.isDefault && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
                        Mặc định
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {formatAddress(a)}
                  </p>
                </div>
              </div>
            </label>
          ))}
          <button
            type="button"
            className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            onClick={() => setShowNewForm(true)}
          >
            + Thêm địa chỉ mới
          </button>
        </div>
      )}

      {(showNewForm || addresses.length === 0) && (
        <div className="space-y-3">
          {isLoggedIn && addresses.length > 0 && (
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              onClick={() => setShowNewForm(false)}
            >
              ← Chọn địa chỉ đã lưu
            </button>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Họ và tên"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Địa chỉ cụ thể (số nhà, đường)"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              className={`${inputClass} sm:col-span-2`}
            />
            <select
              value={form.city}
              onChange={(e) => {
                setForm({ ...form, city: e.target.value, ward: "" });
                setWardOptions([]);
                setWardError(null);
              }}
              className={selectClass}
            >
              <option value="" className="bg-white text-black">— Chọn Tỉnh/Thành —</option>
              {VN_PROVINCES.map((p) => (
                <option key={p} value={p} className="bg-white text-black">
                  {p}
                </option>
              ))}
            </select>
            <select
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value })}
              disabled={!form.city || isLoadingWards}
              className={selectClass}
            >
              <option value="" className="bg-white text-black">
                {!form.city ? "— Chọn Tỉnh/Thành trước —" : isLoadingWards ? "Đang tải..." : "— Chọn Xã/Phường —"}
              </option>
              {wardOptions.map((ward) => (
                <option key={ward} value={ward} className="bg-white text-black">
                  {ward}
                </option>
              ))}
            </select>
            {wardError && <p className="text-xs text-destructive sm:col-span-2">{wardError}</p>}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isQuoting && <p className="text-xs text-muted-foreground">Đang tính phí vận chuyển...</p>}
      {shippingQuoteError && <p className="text-xs text-destructive">{shippingQuoteError}</p>}

      <Button onClick={handleContinue} disabled={isPending} className="w-full">
        {isPending ? "Đang lưu..." : "Tiếp tục đến Thanh toán"}
      </Button>
    </div>
  );
}
