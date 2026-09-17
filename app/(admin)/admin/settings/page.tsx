"use client";

import { useState } from "react";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminButton, Panel } from "@/components/admin/ui";

function Field({
  label,
  value,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 px-5 py-4">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-border bg-foreground/[0.02] px-3 py-2.5 text-[13px] text-foreground focus:border-foreground/40 focus:outline-none"
      />
      {hint ? (
        <span className="text-[10px] tracking-widest text-muted-foreground/60">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Toggle({
  label,
  on,
  hint,
  onChange,
}: {
  label: string;
  on: boolean;
  hint: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className="flex w-full items-center justify-between px-5 py-4 text-left"
    >
      <div>
        <p className="text-[13px] text-foreground">{label}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <span
        className={`flex h-6 w-11 shrink-0 items-center border p-0.5 transition-colors ${on ? "justify-end border-foreground bg-foreground/20" : "justify-start border-border"}`}
      >
        <span
          className={`h-4 w-4 ${on ? "bg-foreground" : "bg-muted-foreground/40"}`}
        />
      </span>
    </button>
  );
}

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  // GIẢ TOÀN BỘ: chưa có StoreSetting. Ngưỡng freeship có nguồn thật nhưng vẫn để state giả trong khung này.
  const [store, setStore] = useState({
    name: "NEXUS",
    email: "ops@nexus.vn",
    currency: "VND (đ)",
    threshold: "1.000.000đ",
    flatRate: "GHN — tính theo thời gian thực",
    processing: "1–2 ngày làm việc",
  });
  const [notifications, setNotifications] = useState({
    orders: true,
    lowStock: true,
    messages: true,
    digest: false,
  });
  const [maintenance, setMaintenance] = useState(false);
  const [sessions, setSessions] = useState(true);
  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminTopbar
        title="Cài đặt"
        crumb="Settings"
        action={<AdminButton onClick={save}>Lưu thay đổi</AdminButton>}
      />
      {saved ? (
        <div className="border border-amber-300/30 bg-amber-300/[0.05] px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-amber-300">
          Giao diện đã lưu tạm — chưa nối logic thật, thay đổi sẽ mất khi tải
          lại trang
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Cửa hàng">
          <div className="divide-y divide-border">
            <Field
              label="Tên cửa hàng"
              value={store.name}
              onChange={(value) => setStore({ ...store, name: value })}
            />
            <Field
              label="Email hỗ trợ"
              value={store.email}
              onChange={(value) => setStore({ ...store, email: value })}
            />
            <Field
              label="Đơn vị tiền tệ"
              value={store.currency}
              hint="Hiển thị trên toàn bộ storefront"
              onChange={(value) => setStore({ ...store, currency: value })}
            />
          </div>
        </Panel>
        <Panel title="Vận chuyển">
          <div className="divide-y divide-border">
            <Field
              label="Ngưỡng freeship"
              value={store.threshold}
              hint="Dữ liệu thật: ShippingSetting.freeShipThreshold"
              onChange={(value) => setStore({ ...store, threshold: value })}
            />
            <Field
              label="Phí vận chuyển"
              value={store.flatRate}
              onChange={(value) => setStore({ ...store, flatRate: value })}
            />
            <Field
              label="Thời gian xử lý"
              value={store.processing}
              onChange={(value) => setStore({ ...store, processing: value })}
            />
          </div>
        </Panel>
        <Panel title="Thanh toán & vận hành" className="lg:col-span-2">
          <div className="divide-y divide-border">
            <Toggle
              label="Chế độ bảo trì"
              on={maintenance}
              onChange={() => setMaintenance(!maintenance)}
              hint="Tạm dừng checkout, giữ site vẫn xem được"
            />
            <Toggle
              label="Checkout khách vãng lai"
              on
              hint="Cho phép mua hàng không cần tài khoản"
              onChange={() => {}}
            />
            <Toggle
              label="Bắt buộc SĐT khi checkout"
              on={false}
              hint="Yêu cầu số điện thoại liên hệ giao hàng"
              onChange={() => {}}
            />
          </div>
        </Panel>
        <Panel title="Thông báo" className="lg:col-span-2">
          <div className="divide-y divide-border">
            <Toggle
              label="Cảnh báo đơn hàng mới"
              on={notifications.orders}
              onChange={() =>
                setNotifications({
                  ...notifications,
                  orders: !notifications.orders,
                })
              }
              hint="Gửi email cho vận hành mỗi khi có đơn mới"
            />
            <Toggle
              label="Cảnh báo sắp hết hàng"
              on={notifications.lowStock}
              onChange={() =>
                setNotifications({
                  ...notifications,
                  lowStock: !notifications.lowStock,
                })
              }
              hint="Báo khi tồn kho dưới 10"
            />
            <Toggle
              label="Tin nhắn khách hàng"
              on={notifications.messages}
              onChange={() =>
                setNotifications({
                  ...notifications,
                  messages: !notifications.messages,
                })
              }
              hint="Báo khi có hội thoại hỗ trợ mới"
            />
            <Toggle
              label="Tổng kết hàng tuần"
              on={notifications.digest}
              onChange={() =>
                setNotifications({
                  ...notifications,
                  digest: !notifications.digest,
                })
              }
              hint="Tóm tắt doanh số mỗi thứ Hai"
            />
          </div>
        </Panel>
        <Panel title="Tài khoản & bảo mật">
          <div className="divide-y divide-border">
            <Field
              label="Email quản trị"
              value="ops@nexus.vn"
              onChange={() => {}}
              hint="Dùng cho cảnh báo và khôi phục"
            />
            <Toggle
              label="Bảo mật phiên đăng nhập"
              on={sessions}
              onChange={() => setSessions(!sessions)}
              hint="Yêu cầu xác thực lại khi đổi thao tác nhạy cảm"
            />
          </div>
        </Panel>
        <Panel title="SEO mặc định">
          <div className="divide-y divide-border">
            <Field
              label="Tiêu đề site"
              value="NEXUS — Utility system wear"
              onChange={() => {}}
            />
            <Field
              label="Mô tả meta"
              value="Thời trang mô-đun cho di chuyển, thời tiết và nhịp sống đô thị."
              onChange={() => {}}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
