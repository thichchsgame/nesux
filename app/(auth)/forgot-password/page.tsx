"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { requestPasswordResetAction } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  function handleSubmit(event: React.FormEvent) { event.preventDefault(); startTransition(async () => { await requestPasswordResetAction(email); setSent(true); }); }
  return <AuthShell><div className="w-full max-w-[420px]"><div className="mb-10"><span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Reset / 03</span><h1 className="mt-4 font-hand text-3xl font-bold uppercase tracking-tight text-foreground">Quên mật khẩu</h1><p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.</p></div>{sent ? <div className="border border-border bg-foreground/[0.03] p-6"><p className="font-hand text-sm uppercase tracking-[0.15em] text-foreground">Đã gửi yêu cầu</p><p className="mt-2 text-[12px] text-muted-foreground">Nếu email này tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi trong vài phút. Kiểm tra cả hộp thư spam.</p></div> : <form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Email</span><input required type="email" placeholder="you@nexus.vn" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-border bg-transparent px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-foreground" /></label><button type="submit" disabled={isPending} className="group flex w-full items-center justify-between border border-foreground bg-foreground px-5 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-black transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-50"><span>{isPending ? "Đang gửi..." : "Gửi link đặt lại"}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} /></button></form>}<div className="mt-8 border-t border-border pt-6 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Nhớ mật khẩu rồi? <Link href="/sign-in" className="text-foreground hover:opacity-60">Đăng nhập</Link></div></div></AuthShell>;
}
