"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type MobileNavProps = {
  navItems: { label: string; href: string }[];
  isLoggedIn: boolean;
};

export function MobileNav({ navItems, isLoggedIn }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)} type="button" className="transition-opacity hover:opacity-60 md:hidden">
        {open ? <X className="h-[18px] w-[18px]" strokeWidth={1.5} /> : <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />}
      </button>
      {open && (
        <nav aria-label="Điều hướng di động" className="absolute left-0 right-0 top-16 border-t border-border bg-background px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-foreground">
                {item.label}
              </Link>
            ))}
            <Link href={isLoggedIn ? "/account" : "/sign-in"} onClick={() => setOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-foreground">
              Tài khoản
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
