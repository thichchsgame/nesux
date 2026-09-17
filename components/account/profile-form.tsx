"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateProfileAction } from "@/app/(storefront)/account/profile/actions";

export function ProfileForm({ initialName, initialPhone, email }: { initialName: string; initialPhone: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(-2)
      .join("")
      .toUpperCase() || "?";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfileAction({ name, phone });
      if (!result.ok) return setError(result.error);
      setSuccess(true);
      setEditing(false);
    });
  }

  return (
    <div className="border border-border p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center border border-border font-hand text-lg uppercase text-foreground">
            {initials}
          </div>
          <div>
            <p className="font-hand text-2xl uppercase text-foreground">{name || "Chưa đặt tên"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="flex items-center gap-2 border border-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground/40"
        >
          <Pencil className="h-3 w-3" /> {editing ? "Đóng" : "Sửa"}
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Họ và tên</span>
            <input required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</span>
            <input disabled value={email} className={`${inputClass} cursor-not-allowed text-muted-foreground`} />
            <span className="mt-2 block text-[11px] text-muted-foreground">Chưa hỗ trợ tự đổi email — liên hệ hỗ trợ nếu cần thay đổi.</span>
          </label>
          <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Số điện thoại</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`${inputClass} placeholder:text-muted-foreground/60`}
            />
            <span className="mt-2 block text-[11px] text-muted-foreground">Số liên hệ tài khoản, không dùng thay cho số điện thoại giao hàng.</span>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-muted-foreground">Đã lưu.</p>}
          <button type="submit" disabled={isPending} className={buttonClass}>{isPending ? "Đang lưu..." : "Lưu thay đổi"}</button>
        </form>
      )}
    </div>
  );
}

const inputClass = "w-full border border-border bg-transparent px-4 py-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-foreground";
const buttonClass = "border border-primary bg-primary px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-transparent hover:text-primary disabled:opacity-50";
