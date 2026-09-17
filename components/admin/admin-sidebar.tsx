"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ImageIcon,
  Ticket,
  BarChart3,
  LifeBuoy,
  Star,
  Settings,
  ArrowUpRight,
} from "lucide-react";

const NAV = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard, index: "01" },
  { label: "Sản phẩm", href: "/admin/products", icon: Package, index: "02" },
  { label: "Đơn hàng", href: "/admin/orders", icon: ShoppingCart, index: "03" },
  { label: "Người dùng", href: "/admin/users", icon: Users, index: "04" },
  { label: "Banner", href: "/admin/banners", icon: ImageIcon, index: "05" },
  { label: "Mã giảm giá", href: "/admin/coupons", icon: Ticket, index: "06" },
  { label: "Thống kê", href: "/admin/analytics", icon: BarChart3, index: "07" },
  { label: "Hỗ trợ", href: "/admin/support", icon: LifeBuoy, index: "08" },
  { label: "Đánh giá", href: "/admin/reviews", icon: Star, index: "09" },
  { label: "Cài đặt", href: "/admin/settings", icon: Settings, index: "10" },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-background md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link
          href="/admin"
          className="font-hand text-lg font-bold tracking-[0.25em] text-foreground"
        >
          NEXUS
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Admin
        </span>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-visible md:py-6">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex shrink-0 items-center gap-3 px-3 py-2.5 text-[12px] uppercase tracking-[0.15em] transition-colors ${
                active
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              <span>{item.label}</span>
              <span className="ml-auto hidden text-[10px] tracking-[0.2em] text-muted-foreground/50 md:inline">
                {item.index}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-border p-4 md:block">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>Xem cửa hàng</span>
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </div>
    </aside>
  );
}
