"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/account", label: "Tổng quan" },
  { href: "/account/orders", label: "Đơn hàng" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Địa chỉ" },
  { href: "/account/profile", label: "Hồ sơ" },
  { href: "/account/try-on", label: "Thử đồ AI" },
] as const;

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex flex-wrap gap-2" aria-label="Các mục tài khoản">
      {TABS.map((tab) => {
        const active = tab.href === "/account" ? pathname === "/account" : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border px-4 py-3 text-[10px] uppercase tracking-[0.16em] transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
