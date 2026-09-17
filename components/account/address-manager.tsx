"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VN_PROVINCES } from "@/lib/vn-provinces";
import { getWardOptionsAction } from "@/app/(storefront)/checkout/shipping-actions";
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/app/(storefront)/account/addresses/actions";

type AddressItem = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  ward: string | null;
  city: string;
  isDefault: boolean;
};

type FormState = {
  fullName: string;
  phone: string;
  line1: string;
  ward: string;
  city: string;
};

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  line1: "",
  ward: "",
  city: "",
};

const inputClass =
  "w-full border border-border bg-transparent px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-foreground";

const selectClass = `${inputClass} appearance-none cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a8a8a%22 stroke-width=%221.6%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_14px_center] bg-[length:14px]`;

function formatAddress(a: {
  line1: string;
  ward: string | null;
  city: string;
}) {
  return [a.line1, a.ward, a.city].filter(Boolean).join(", ");
}

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: AddressItem[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Cơ chế Tỉnh → Xã/Phường: dùng chung action với checkout (getWardOptionsAction),
  // không viết logic riêng để tránh lệch data giữa 2 nơi.
  const [wardOptions, setWardOptions] = useState<string[]>([]);
  const [wardError, setWardError] = useState<string | null>(null);
  const [isLoadingWards, startLoadingWards] = useTransition();

  const formOpen = showAddForm || editingId !== null;

  useEffect(() => {
    if (!formOpen || !form.city) {
      setWardOptions([]);
      return;
    }
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
  }, [form.city, formOpen]);

  function startEdit(a: AddressItem) {
    setEditingId(a.id);
    setShowAddForm(false);
    setForm({
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      ward: a.ward ?? "",
      city: a.city,
    });
  }

  function openAddForm() {
    setShowAddForm(true);
    setEditingId(null);
    setForm(emptyForm);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowAddForm(false);
    setError(null);
  }

  function handleSave() {
    setError(null);
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.line1.trim() ||
      !form.city ||
      !form.ward
    ) {
      setError("Vui lòng điền đầy đủ thông tin, bao gồm Xã/Phường.");
      return;
    }
    startTransition(async () => {
      const res = editingId
        ? await updateAddressAction(editingId, form)
        : await createAddressAction(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      resetForm();
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Xoá địa chỉ này?")) return;
    startTransition(async () => {
      const res = await deleteAddressAction(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const res = await setDefaultAddressAction(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id })),
      );
    });
  }

  const formFields = (
    <div className="grid gap-3 md:grid-cols-2">
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
        placeholder="Địa chỉ cụ thể"
        value={form.line1}
        onChange={(e) => setForm({ ...form, line1: e.target.value })}
        className={`${inputClass} md:col-span-2`}
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
        <option value="">— Chọn Tỉnh/Thành —</option>
        {VN_PROVINCES.map((p) => (
          <option key={p} value={p}>
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
        <option value="">
          {!form.city
            ? "— Chọn Tỉnh/Thành trước —"
            : isLoadingWards
              ? "Đang tải..."
              : "— Chọn Xã/Phường —"}
        </option>
        {wardOptions.map((ward) => (
          <option key={ward} value={ward}>
            {ward}
          </option>
        ))}
      </select>
      {wardError && (
        <p className="text-xs text-destructive md:col-span-2">{wardError}</p>
      )}
      {error && (
        <p className="text-sm text-destructive md:col-span-2">{error}</p>
      )}
      <div className="flex gap-3 md:col-span-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Đang lưu..." : "Lưu"}
        </Button>
        <Button size="sm" variant="outline" onClick={resetForm}>
          Huỷ
        </Button>
      </div>
    </div>
  );

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Delivery system
          </p>
          <h2 className="mt-2 font-hand text-3xl uppercase text-foreground">
            Địa chỉ đã lưu
          </h2>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-2 border border-border px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-foreground transition-colors hover:border-foreground/40"
          >
            <Plus className="h-4 w-4" /> Thêm địa chỉ
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <article key={a.id} className="border border-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-hand text-lg uppercase text-foreground">
                  {a.fullName}
                </h3>
              </div>
              {a.isDefault && (
                // Ngoại lệ có chủ đích (giống dot màu Orders) — theme gốc mono nhưng badge "Mặc định"
                // và trạng thái xác thực dùng emerald để bám sát demo.
                <span className="border border-emerald-300/30 px-2 py-1 text-[10px] uppercase text-emerald-300">
                  Mặc định
                </span>
              )}
            </div>
            <div className="mt-5 space-y-1 text-sm text-muted-foreground">
              <p>{a.phone}</p>
              <p>{formatAddress(a)}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.13em]">
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(a.id)}
                  className="border border-border px-3 py-2 text-foreground hover:border-foreground/40"
                >
                  Đặt mặc định
                </button>
              )}
              <button
                type="button"
                onClick={() => startEdit(a)}
                className="flex items-center gap-1 border border-border px-3 py-2 text-foreground hover:border-foreground/40"
              >
                <Pencil className="h-3 w-3" /> Sửa
              </button>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="flex items-center gap-1 border border-destructive/30 px-3 py-2 text-destructive"
              >
                <Trash2 className="h-3 w-3" /> Xoá
              </button>
            </div>
            {editingId === a.id && (
              <div className="mt-6 border-t border-border pt-5">
                {formFields}
              </div>
            )}
          </article>
        ))}
      </div>

      {showAddForm && (
        <div className="mt-6 border border-border bg-foreground/[0.03] p-5">
          <div className="flex justify-between">
            <h3 className="font-hand text-xl uppercase text-foreground">
              Thêm địa chỉ mới
            </h3>
            <button
              type="button"
              aria-label="Đóng form thêm địa chỉ"
              onClick={resetForm}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="mt-5">{formFields}</div>
        </div>
      )}
    </section>
  );
}
