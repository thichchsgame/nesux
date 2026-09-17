import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { MobileNav } from "@/components/layout/mobile-nav";

const NAV = [
  { label: "Shop", href: "/products" },
  { label: "Sale", href: "/#sale" },
  { label: "System", href: "/#statement" },
  { label: "Explore", href: "/#explore" },
  { label: "About", href: "/#footer" },
];

export async function Header() {
  const session = await auth();
  const cart = await getOrCreateCart(session?.user?.id);
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-10">
        <Link href="/" className="font-hand text-xl font-bold tracking-[0.25em] text-foreground">
          NEXUS
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 text-foreground">
          <Link href="/search" aria-label="Tìm kiếm" className="transition-opacity hover:opacity-60">
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <Link href={session ? "/account" : "/sign-in"} aria-label="Tài khoản" className="transition-opacity hover:opacity-60">
            <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <Link href={session ? "/account/wishlist" : "/sign-in"} aria-label="Wishlist" className="hidden transition-opacity hover:opacity-60 sm:inline-flex">
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <Link href="/cart" aria-label="Giỏ hàng" className="flex items-center gap-2 transition-opacity hover:opacity-60">
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {cartCount > 0 && <span className="font-mono text-[11px] text-muted-foreground">({cartCount})</span>}
          </Link>
          <MobileNav navItems={NAV} isLoggedIn={!!session} />
        </div>
      </div>
    </header>
  );
}
