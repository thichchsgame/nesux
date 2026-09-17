// app/checkout/order-actions.ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  cancelOrderAndRestoreStock,
  createOrder,
  getOrderByNumber,
} from "@/lib/orders";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";
import { createVnpayPaymentUrl } from "@/lib/payments/vnpay";
import { createCodPayment } from "@/lib/payments/cod";

type ShippingAddressForm = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  ward?: string;
  district?: string;
  city: string;
  postalCode?: string;
};

type PlaceOrderInput = {
  shippingAddress: ShippingAddressForm;
  guestEmail?: string;
  method: "STRIPE" | "VNPAY" | "COD";
  shippingMethod: "STANDARD" | "EXPRESS";
  couponId?: string;
  couponCode?: string;
  discountAmount?: number;
};

type ActionResult =
  | { ok: true; orderNumber: string; redirectUrl: string }
  | { ok: false; error: string };

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.id && session.user.suspended) {
    return {
      ok: false,
      error:
        "Tài khoản của bạn hiện không thể đặt hàng. Vui lòng liên hệ hỗ trợ.",
    };
  }

  if (!session?.user?.id && !input.guestEmail) {
    return { ok: false, error: "Vui lòng nhập email để tiếp tục." };
  }

  // 1) Tạo Order thật — trừ tồn kho NGAY tại đây (quyết định đã chốt ở Bước 2),
  //    trước khi biết kết quả thanh toán.
  let order;
  try {
    order = await createOrder({
      userId: session?.user?.id,
      guestEmail: input.guestEmail,
      shippingAddress: input.shippingAddress,
      shippingMethod: input.shippingMethod,
      couponId: input.couponId,
      couponCode: input.couponCode,
      discountAmount: input.discountAmount,
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra khi tạo đơn hàng.",
    };
  }

  // 2) Tạo phiên/URL thanh toán theo đúng cổng đã chọn.
  try {
    const redirectUrl =
      input.method === "STRIPE"
        ? await createStripeCheckoutSession(order)
        : input.method === "VNPAY"
          ? await createVnpayPaymentUrl(order, await getClientIp())
          : await createCodPayment(
              order,
              session?.user?.email ?? input.guestEmail!,
            );

    return { ok: true, orderNumber: order.orderNumber, redirectUrl };
  } catch (e) {
    // Order đã tạo, tồn kho đã trừ, nhưng không tạo được phiên thanh toán → trả tồn kho ngay,
    // không để đơn PENDING "mồ côi" (không có phiên thanh toán nào đang chờ xử lý thật sự).
    console.error("Lỗi tạo phiên thanh toán:", e);
    await cancelOrderAndRestoreStock(order.id).catch((cleanupError) => {
      console.error(
        "Lỗi hoàn tồn kho sau khi tạo phiên thanh toán thất bại:",
        cleanupError,
      );
    });
    return {
      ok: false,
      error: "Không thể kết nối cổng thanh toán, vui lòng thử lại.",
    };
  }
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  // Vercel/proxy đặt IP thật vào x-forwarded-for; localhost dev không có header này nên fallback.
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function retryPaymentAction(
  orderNumber: string,
): Promise<ActionResult> {
  const session = await auth();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) return { ok: false, error: "Không tìm thấy đơn hàng." };
  if (order.status !== "PENDING") {
    return {
      ok: false,
      error: "Đơn hàng này không còn ở trạng thái chờ thanh toán.",
    };
  }
  if (order.userId && order.userId !== session?.user?.id) {
    return { ok: false, error: "Không có quyền truy cập đơn hàng này." };
  }

  const lastProvider = order.payments[0]?.provider ?? "STRIPE";
  try {
    const redirectUrl =
      lastProvider === "STRIPE"
        ? await createStripeCheckoutSession(order)
        : await createVnpayPaymentUrl(order, await getClientIp());
    return { ok: true, orderNumber: order.orderNumber, redirectUrl };
  } catch (e) {
    console.error("Lỗi tạo lại phiên thanh toán:", e);
    return {
      ok: false,
      error: "Không thể kết nối cổng thanh toán, vui lòng thử lại.",
    };
  }
}

export async function cancelMyOrderAction(
  orderNumber: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Vui lòng đăng nhập.");

    const order = await getOrderByNumber(orderNumber, {
      userId: session.user.id,
    });
    if (!order) throw new Error("Không tìm thấy đơn hàng.");
    if (order.status !== "PENDING") {
      throw new Error("Chỉ có thể huỷ đơn đang ở trạng thái Chờ thanh toán.");
    }

    await cancelOrderAndRestoreStock(order.id);
    revalidatePath("/account/orders");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Có lỗi xảy ra.",
    };
  }
}

export async function changePaymentMethodAction(
  orderNumber: string,
  method: "STRIPE" | "VNPAY" | "COD",
): Promise<ActionResult> {
  const session = await auth();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: true },
  });

  if (!order) return { ok: false, error: "Không tìm thấy đơn hàng." };
  if (order.userId && order.userId !== session?.user?.id) {
    return { ok: false, error: "Không có quyền truy cập đơn hàng này." };
  }
  if (order.status !== "PENDING") {
    return {
      ok: false,
      error:
        "Đơn hàng không còn ở trạng thái chờ thanh toán, không thể đổi phương thức.",
    };
  }

  const hasSucceeded = order.payments.some((p) => p.status === "SUCCEEDED");
  if (hasSucceeded) {
    return {
      ok: false,
      error: "Đơn hàng đã thanh toán thành công, không thể đổi phương thức.",
    };
  }

  try {
    const email = session?.user?.email ?? order.guestEmail ?? "";
    const redirectUrl =
      method === "STRIPE"
        ? await createStripeCheckoutSession(order)
        : method === "VNPAY"
          ? await createVnpayPaymentUrl(order, await getClientIp())
          : await createCodPayment(order, email);

    revalidatePath("/account/orders");
    return { ok: true, orderNumber: order.orderNumber, redirectUrl };
  } catch (e) {
    console.error("Lỗi đổi phương thức thanh toán:", e);
    return {
      ok: false,
      error: "Không thể chuyển sang phương thức mới, vui lòng thử lại.",
    };
  }
}
