// lib/orders.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import {
  computeCustomerShippingFee,
  createShippingOrder,
  getFreeShipThreshold,
  getShippingQuote,
  type ShippingMethodCode,
} from "@/lib/shipping";
import { ALLOWED_STATUS_TRANSITIONS } from "@/lib/order-status";
import type { OrderStatus } from "@/app/generated/prisma/enums";

type ShippingAddressInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  ward?: string | null;
  district?: string | null;
  city: string;
  postalCode?: string | null;
  country?: string;
};

type CreateOrderInput = {
  userId?: string; // undefined = guest checkout
  guestEmail?: string; // bắt buộc nếu userId undefined
  shippingAddress: ShippingAddressInput;
  shippingMethod: ShippingMethodCode;
  // Coupon đã được validate + tính discount ở lib/coupons.ts (Bước 3) TRƯỚC khi gọi hàm này.
  // orders.ts chỉ chịu trách nhiệm tăng usedCount một cách an toàn (atomic).
  couponId?: string;
  couponCode?: string;
  discountAmount?: number;
};

function generateOrderNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NEXUS-${ymd}-${rand}`;
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.userId && !input.guestEmail) {
    throw new Error("Cần email để tạo đơn hàng cho khách vãng lai.");
  }

  const cart = await getOrCreateCart(input.userId);
  if (cart.items.length === 0) {
    throw new Error("Giỏ hàng trống, không thể tạo đơn hàng.");
  }

  const subtotalBeforeTransaction = cart.items.reduce((sum, item) => {
    const unitPrice = Number(
      item.variant.priceOverride ?? item.variant.product.basePrice,
    );
    return sum + unitPrice * item.quantity;
  }, 0);
  const discountBeforeTransaction = input.discountAmount ?? 0;
  if (!input.shippingAddress.ward)
    throw new Error("Thiếu Xã/Phường để tính phí vận chuyển.");
  const weight = cart.items.reduce(
    (sum, item) => sum + item.variant.weightGrams * item.quantity,
    0,
  );
  const carrierFee = (
    await getShippingQuote(
      {
        provinceName: input.shippingAddress.city,
        wardName: input.shippingAddress.ward,
      },
      weight,
    )
  ).carrierFee;
  const { customerFee: calculatedShippingFee } = computeCustomerShippingFee({
    method: input.shippingMethod,
    carrierFee,
    discountedSubtotal: subtotalBeforeTransaction - discountBeforeTransaction,
    freeShipThreshold: await getFreeShipThreshold(),
  });

  return prisma.$transaction(async (tx) => {
    // 1) Trừ tồn kho ATOMIC — updateMany với điều kiện stock >= quantity trong cùng 1 câu lệnh,
    //    tránh race condition khi 2 request đọc stock cũ rồi cùng trừ (lost update).
    const orderItemsData = [];
    for (const item of cart.items) {
      const result = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new Error(
          `"${item.variant.product.name}" (${[item.variant.size, item.variant.color].filter(Boolean).join("/")}) không đủ tồn kho. Vui lòng cập nhật giỏ hàng.`,
        );
      }

      const unitPrice = Number(
        item.variant.priceOverride ?? item.variant.product.basePrice,
      );
      orderItemsData.push({
        variantId: item.variantId,
        productNameSnapshot: item.variant.product.name,
        variantSkuSnapshot: item.variant.sku,
        sizeSnapshot: item.variant.size,
        colorSnapshot: item.variant.color,
        unitPriceSnapshot: unitPrice,
        weightGrams: item.variant.weightGrams,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      });
    }

    const subtotal = orderItemsData.reduce((sum, i) => sum + i.lineTotal, 0);
    const discountAmount = input.discountAmount ?? 0;
    const shippingFee = calculatedShippingFee;
    const totalAmount = subtotal - discountAmount + shippingFee;

    // 2) Tăng usedCount của coupon ATOMIC, tôn trọng usageLimit (nếu có) — chống 2 người
    //    cùng dùng nốt lượt cuối cùng của mã giảm giá giới hạn số lần.
    if (input.couponId) {
      const bump = await tx.coupon.updateMany({
        where: {
          id: input.couponId,
          OR: [
            { usageLimit: null },
            {
              usedCount: {
                lt: prisma.coupon.fields.usageLimit as unknown as number,
              },
            },
          ],
        },
        data: { usedCount: { increment: 1 } },
      });
      // Prisma không so sánh được 2 cột trong updateMany where như trên (giả field ref) —
      // xử lý đúng cách: đọc coupon trước, so sánh ở app rồi update có điều kiện usedCount cụ thể.
      if (bump.count === 0) {
        const coupon = await tx.coupon.findUniqueOrThrow({
          where: { id: input.couponId },
        });
        if (
          coupon.usageLimit !== null &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          throw new Error("Mã giảm giá đã hết lượt sử dụng.");
        }
        await tx.coupon.update({
          where: { id: input.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // 3) Tạo Order + OrderItem (snapshot)
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: input.userId,
        guestEmail: input.userId ? null : input.guestEmail,
        subtotal,
        shippingFee,
        shippingCarrierFee: carrierFee,
        shippingMethod: input.shippingMethod,
        discountAmount,
        totalAmount,
        couponId: input.couponId,
        couponCode: input.couponCode,
        shippingFullName: input.shippingAddress.fullName,
        shippingPhone: input.shippingAddress.phone,
        shippingLine1: input.shippingAddress.line1,
        shippingLine2: input.shippingAddress.line2,
        shippingWard: input.shippingAddress.ward,
        shippingDistrict: input.shippingAddress.district,
        shippingCity: input.shippingAddress.city,
        shippingPostalCode: input.shippingAddress.postalCode,
        shippingCountry: input.shippingAddress.country ?? "VN",
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    await tx.orderStatusEvent.create({
      data: { orderId: order.id, status: "PENDING", note: "Đơn hàng được tạo" },
    });

    // 4) Xoá cart — quyết định đã chốt: xoá ngay khi tạo Order (không đợi thanh toán xong)
    await tx.cart.delete({ where: { id: cart.id } });

    return order;
  });
}

export async function cancelOrderAndRestoreStock(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    // Chỉ huỷ đơn đang PENDING — tránh lỡ tay huỷ/hoàn kho nhầm đơn đã PAID nếu hàm này
    // bị gọi lại (VD 2 event webhook đến gần nhau, hoặc job cron chạy trễ).
    if (order.status !== "PENDING") return;

    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
      // variantId null nghĩa là variant gốc đã bị xoá trước đó — không còn gì để trả tồn kho.
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
    await tx.orderStatusEvent.create({
      data: { orderId, status: "CANCELLED" },
    });
  });
}

export async function getOrderByNumber(
  orderNumber: string,
  ownerCheck?: { userId?: string; guestEmail?: string },
) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) return null;

  if (ownerCheck) {
    const ownsAsUser = ownerCheck.userId && order.userId === ownerCheck.userId;
    const ownsAsGuest =
      !order.userId &&
      ownerCheck.guestEmail &&
      order.guestEmail === ownerCheck.guestEmail;
    if (!ownsAsUser && !ownsAsGuest) {
      throw new Error("Không có quyền xem đơn hàng này.");
    }
  }

  return order;
}

export async function cleanupExpiredPendingOrders(olderThanMinutes = 30) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoff },
      // COD không có phiên thanh toán online nào để "bỏ ngang" — PENDING của COD là
      // đang chờ giao hàng thu tiền, không được tự động huỷ theo thời gian như Stripe/VNPay.
      NOT: { payments: { some: { provider: "COD" } } },
    },
    select: { id: true, orderNumber: true },
  });

  let cancelledCount = 0;
  for (const o of staleOrders) {
    await cancelOrderAndRestoreStock(o.id);
    cancelledCount++;
  }
  return {
    cancelledCount,
    orderNumbers: staleOrders.map((o) => o.orderNumber),
  };
}

export async function listOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllOrders(params?: {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 30;
  const where = params?.status ? { status: params.status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, pageSize };
}

export async function getOrderSummaryStats() {
  const [total, awaiting, inTransit, revenueAgg] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    total,
    awaiting,
    inTransit,
    netRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
  };
}

export async function getOrderForAdmin(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      user: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });
}

export { ALLOWED_STATUS_TRANSITIONS };

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const current = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { status: true, orderNumber: true },
  });

  if (current.status === status) {
    return prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, payments: true },
    });
  }

  if (!ALLOWED_STATUS_TRANSITIONS[current.status].includes(status)) {
    throw new Error(
      `Không thể chuyển đơn ${current.orderNumber} từ "${current.status}" sang "${status}" — không đúng luồng nghiệp vụ.`,
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true, payments: true },
    });
    await tx.orderStatusEvent.create({ data: { orderId, status } });
    return updated;
  });

  if (status === "DELIVERED") {
    const codPayment = order.payments.find(
      (payment) => payment.provider === "COD" && payment.status === "PENDING",
    );
    if (codPayment) {
      await prisma.payment.update({
        where: { id: codPayment.id },
        data: { status: "SUCCEEDED" },
      });
    }
  }

  if (status === "PROCESSING" && !order.trackingCode) {
    const isCod = order.payments.some((payment) => payment.provider === "COD");
    const weightGrams = order.items.reduce(
      (sum, item) => sum + (item.weightGrams ?? 0) * item.quantity,
      0,
    );

    try {
      if (weightGrams === 0) {
        throw new Error(
          "Thiếu dữ liệu cân nặng (đơn tạo trước khi có snapshot weightGrams) — cần tạo vận đơn GHN thủ công.",
        );
      }
      if (!order.shippingWard) {
        throw new Error(
          "Đơn hàng thiếu Xã/Phường trong địa chỉ giao — không thể tạo vận đơn GHN.",
        );
      }

      const result = await createShippingOrder({
        toName: order.shippingFullName,
        toPhone: order.shippingPhone,
        toAddress: order.shippingLine1,
        destination: {
          provinceName: order.shippingCity,
          wardName: order.shippingWard,
        },
        weightGrams,
        codAmount: isCod ? Number(order.totalAmount) : 0,
        clientOrderCode: order.orderNumber,
        items: order.items.map((item) => ({
          name: item.productNameSnapshot,
          code: item.variantSkuSnapshot,
          quantity: item.quantity,
          price: Number(item.unitPriceSnapshot),
        })),
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { trackingCode: result.trackingCode },
      });
    } catch (error) {
      console.error(
        `Không thể tạo vận đơn GHN cho ${order.orderNumber}:`,
        error,
      );
    }
  }

  return order;
}
