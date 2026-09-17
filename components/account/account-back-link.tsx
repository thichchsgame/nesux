"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AccountBackLink() {
  const pathname = usePathname();
  if (pathname === "/account") return null;

  return (
    <Link
      href="/account"
      className="mb-8 inline-block text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Quay lại tài khoản
    </Link>
  );
}
