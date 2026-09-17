"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth-shell";

const inputClass = "w-full border border-border bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-foreground";

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  function handleSubmit(event: React.FormEvent) { event.preventDefault(); setError(null); startTransition(async () => { const result = await signIn("credentials", { ...form, redirect: false }); if (result?.error) return setError("Email hoặc mật khẩu không đúng."); router.push("/account"); router.refresh(); }); }
  return <AuthShell><div className="w-full max-w-[420px]"><div className="mb-10"><span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Access / 01</span><h1 className="mt-4 font-hand text-3xl font-bold uppercase tracking-tight text-foreground">Đăng nhập</h1><p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">Nhập thông tin để truy cập hệ thống NEXUS.</p></div><button type="button" onClick={() => signIn("google", { callbackUrl: "/account" })} className="mb-6 flex w-full items-center justify-center border border-border px-5 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-foreground transition-colors hover:border-foreground/60 hover:bg-foreground/5">Đăng nhập với Google</button><div className="mb-6 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Hoặc</span><div className="h-px flex-1 bg-border" /></div><form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</span><input required type="email" placeholder="you@nexus.vn" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></label><label className="block"><span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Mật khẩu</span><input required type="password" placeholder="••••••••" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} /></label><div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-muted-foreground"><label className="flex items-center gap-2"><input type="checkbox" className="accent-foreground" />Remember</label><Link href="/forgot-password" className="hover:text-foreground">Quên mật khẩu?</Link></div>{error && <p className="text-sm text-destructive">{error}</p>}<button type="submit" disabled={isPending} className="group flex w-full items-center justify-between border border-foreground bg-foreground px-5 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-black transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-50"><span>{isPending ? "Đang đăng nhập..." : "Đăng nhập"}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} /></button></form><div className="mt-8 border-t border-border pt-6 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Chưa có tài khoản? <Link href="/sign-up" className="text-foreground hover:opacity-60">Đăng ký</Link></div></div></AuthShell>;
}
