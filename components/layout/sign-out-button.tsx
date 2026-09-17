"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="border border-border px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-foreground transition-colors hover:border-foreground/40"
    >
      Đăng xuất
    </button>
  );
}
