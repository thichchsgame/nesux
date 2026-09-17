// app/checkout/vnpay-return/page.tsx
import { verifyVnpaySignature } from "@/lib/payments/vnpay";
import { prisma } from "@/lib/prisma";

export default async function VnpayReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const usp = new URLSearchParams(params);
  const isValidSignature = verifyVnpaySignature(usp);
  const paymentId = params.vnp_TxnRef;

  // Chỉ ĐỌC trạng thái Order hiện tại (do IPN đã cập nhật trước đó, nếu IPN tới kịp) để hiển thị
  // cho khách — trang này không tự ý set status, tránh trường hợp khách sửa query param trên
  // trình duyệt để giả vờ "đã thanh toán".
  const payment = paymentId ? await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } }) : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      {!isValidSignature ? (
        <p className="text-destructive">Không xác thực được thông tin thanh toán.</p>
      ) : payment?.order.status === "PAID" ? (
        <>
          <h1 className="font-hand text-2xl">Thanh toán thành công!</h1>
          <p>
            Mã đơn hàng: <span className="font-mono">{payment.order.orderNumber}</span>
          </p>
        </>
      ) : (
        <>
          <h1 className="font-hand text-2xl">Đang xác nhận thanh toán</h1>
          <p className="text-sm text-muted-foreground">
            Kết quả sẽ được cập nhật trong giây lát. Nếu chờ lâu, vui lòng kiểm tra email hoặc liên hệ hỗ trợ.
          </p>
        </>
      )}
    </div>
  );
}