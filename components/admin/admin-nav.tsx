"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/coupons", label: "Mã giảm giá" },
  { href: "/admin/users", label: "Người dùng" },
  { href: "/admin/reviews", label: "Đánh giá" },
  { href: "/admin/questions", label: "Hỏi đáp" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-6 border-b border-dashed border-border mb-10 font-mono text-xs">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`pb-3 -mb-px border-b-2 ${
              active ? "border-accent text-foreground font-bold" : "border-transparent text-muted-foreground hover:border-border"
            }`}
          >
            {tab.label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
