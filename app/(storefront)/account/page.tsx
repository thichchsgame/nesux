import Link from "next/link";

const CARDS = [
  { title: "Hồ sơ", desc: "Thông tin cá nhân, mật khẩu, bảo mật tài khoản.", href: "/account/profile" },
  { title: "Đơn hàng", desc: "Theo dõi các đơn hàng NEXUS gần đây.", href: "/account/orders" },
  { title: "Địa chỉ", desc: "Quản lý địa chỉ giao hàng đã lưu.", href: "/account/addresses" },
  { title: "Wishlist", desc: "Các sản phẩm bạn đã lưu lại.", href: "/account/wishlist" },
  { title: "Thử đồ AI", desc: "Lịch sử thử đồ bằng AI trên ảnh của bạn.", href: "/account/try-on" },
];

export default function AccountIndexPage() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {CARDS.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="border border-border p-6 transition-colors hover:border-foreground/40"
        >
          <p className="font-hand text-xl uppercase text-foreground">{card.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
          <span className="mt-8 inline-block text-[10px] uppercase tracking-[0.2em] text-foreground">Mở →</span>
        </Link>
      ))}
    </div>
  );
}
