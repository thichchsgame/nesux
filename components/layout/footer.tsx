import Link from "next/link";
import { getCategoryTree } from "@/lib/products";

const SUPPORT_LINKS = [
  { label: "Shipping", href: "/" },
  { label: "Returns", href: "/" },
  { label: "Size guide", href: "/" },
  { label: "Track order", href: "/account/orders" },
  { label: "Contact", href: "/" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/" },
  { label: "Sustainability", href: "/" },
  { label: "Stores", href: "/" },
  { label: "Careers", href: "/" },
  { label: "Press", href: "/" },
];

export async function Footer() {
  const categories = await getCategoryTree();

  return (
    <footer
      id="footer"
      className="scroll-mt-20 border-t border-border bg-background"
    >
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-hand text-3xl font-bold tracking-[0.2em] text-foreground">
              NEXUS
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Utility system wear cho cuộc sống hằng ngày. Thiết kế để di
              chuyển, làm để bền lâu.
            </p>
            <form
              className="mt-8 flex max-w-xs items-center border-b border-border pb-2"
              action="#"
            >
              <input
                type="email"
                required
                placeholder="Email nhận tin drop mới"
                aria-label="Địa chỉ email"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="text-[11px] uppercase tracking-[0.2em] text-foreground transition-opacity hover:opacity-60"
              >
                Join
              </button>
            </form>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Shop
            </h4>
            <ul className="mt-5 space-y-3">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="text-sm text-foreground transition-opacity hover:opacity-60"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Support
            </h4>
            <ul className="mt-5 space-y-3">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground transition-opacity hover:opacity-60"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Company
            </h4>
            <ul className="mt-5 space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground transition-opacity hover:opacity-60"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-6 text-[11px] uppercase tracking-[0.15em] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} NEXUS. All rights reserved.</span>
          <div className="flex gap-6">
            <span>Instagram</span>
            <span>TikTok</span>
            <span>Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
