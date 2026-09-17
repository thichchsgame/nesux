"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/app/(storefront)/account/profile/actions";

const initialForm = { currentPassword: "", newPassword: "", confirmNewPassword: "" };

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword !== form.confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction(form);
      if (!result.ok) return setError(result.error);
      setSuccess(true);
      setForm(initialForm);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {hasPassword ? (
        <PasswordField label="Mật khẩu hiện tại" value={form.currentPassword} onChange={(currentPassword) => setForm({ ...form, currentPassword })} />
      ) : (
        <p className="text-[12px] leading-relaxed text-muted-foreground">Tài khoản của bạn đăng nhập qua Google và chưa có mật khẩu. Đặt mật khẩu bên dưới để có thể đăng nhập bằng email/mật khẩu song song với Google.</p>
      )}
      <PasswordField label="Mật khẩu mới (tối thiểu 8 ký tự)" value={form.newPassword} onChange={(newPassword) => setForm({ ...form, newPassword })} />
      <PasswordField label="Xác nhận mật khẩu mới" value={form.confirmNewPassword} onChange={(confirmNewPassword) => setForm({ ...form, confirmNewPassword })} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-muted-foreground">Đổi mật khẩu thành công.</p>}
      <button type="submit" disabled={isPending} className={buttonClass}>{isPending ? "Đang lưu..." : hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}</button>
    </form>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span><input required type="password" placeholder="••••••••" value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

const inputClass = "w-full border border-border bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-foreground";
const buttonClass = "border border-primary bg-primary px-5 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-transparent hover:text-primary disabled:opacity-50";
