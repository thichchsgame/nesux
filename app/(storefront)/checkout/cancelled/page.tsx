import { RetryPaymentButton } from "@/components/checkout/retry-payment-button";

export default async function CheckoutCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
      <h1 className="font-hand text-2xl">Đã huỷ thanh toán</h1>
      <p className="text-sm text-muted-foreground">
        {order ? `Đơn hàng ${order} chưa được thanh toán.` : "Bạn đã huỷ ở trang thanh toán."} Đơn hàng
        vẫn đang được giữ, bạn có thể thử thanh toán lại ngay.
      </p>
      {order ? (
        <RetryPaymentButton orderNumber={order} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Không tìm thấy mã đơn hàng để thử lại — vui lòng đặt hàng lại từ giỏ hàng.
        </p>
      )}
    </div>
  );
}
