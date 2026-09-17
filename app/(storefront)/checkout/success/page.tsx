// app/checkout/success/page.tsx
import { getOrderByNumber } from "@/lib/orders";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await getOrderByNumber(orderNumber) : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="font-hand text-2xl">Cảm ơn bạn đã đặt hàng!</h1>
      {order ? (
        <>
          <p>
            Mã đơn hàng: <span className="font-mono">{order.orderNumber}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {order.status === "PAID"
              ? "Thanh toán thành công. Chúng tôi sẽ gửi email xác nhận sớm."
              : "Đang xác nhận thanh toán — trạng thái sẽ cập nhật trong ít phút, vui lòng kiểm tra email."}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Không tìm thấy thông tin đơn hàng.</p>
      )}
    </div>
  );
}
