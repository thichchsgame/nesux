import "server-only";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/app/generated/prisma/enums";

const SUCCESS_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];
const PENDING_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING"];
const NEGATIVE_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];
const LOW_STOCK_THRESHOLD = 5;

export async function getDashboardStats() {
  const [
    revenueAgg,
    totalOrders,
    topProductsRaw,
    lowStockVariants,
    topCoupons,
    customersCount,
    pendingCount,
    negativeCount,
    outOfStockCount,
    recentOrdersRaw,
    salesByCategoryRaw,
    revenueTrendRaw,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: SUCCESS_STATUSES } },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    }),
    prisma.order.count({ where: { status: { in: SUCCESS_STATUSES } } }),
    prisma.orderItem.groupBy({
      by: ["productNameSnapshot"],
      where: { order: { status: { in: SUCCESS_STATUSES } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD, gt: 0 } },
      include: { product: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    prisma.coupon.findMany({
      where: { usedCount: { gt: 0 } },
      orderBy: { usedCount: "desc" },
      take: 5,
    }),
    prisma.order
      .findMany({
        where: { userId: { not: null } },
        distinct: ["userId"],
        select: { userId: true },
      })
      .then((r) => r.length),
    prisma.order.count({ where: { status: { in: PENDING_STATUSES } } }),
    prisma.order.count({ where: { status: { in: NEGATIVE_STATUSES } } }),
    prisma.productVariant.count({ where: { stock: 0 } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.$queryRaw<{ category: string; total: number }[]>`
      SELECT c.name AS category, SUM(oi."lineTotal")::float AS total
      FROM "order_items" oi
      JOIN "orders" o ON o.id = oi."orderId"
      JOIN "product_variants" v ON v.id = oi."variantId"
      JOIN "products" p ON p.id = v."productId"
      JOIN "categories" c ON c.id = p."categoryId"
      WHERE o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 6;
    `,
    prisma.$queryRaw<{ day: string; total: number }[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'DD/MM') AS day, SUM("totalAmount")::float AS total
      FROM "orders"
      WHERE status IN ('PAID','PROCESSING','SHIPPED','DELIVERED') AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY 1, date_trunc('day', "createdAt")
      ORDER BY date_trunc('day', "createdAt") ASC;
    `,
  ]);

  const totalSalesForShare =
    salesByCategoryRaw.reduce((sum, c) => sum + c.total, 0) || 1;

  return {
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    avgOrderValue: Number(revenueAgg._avg.totalAmount ?? 0),
    totalOrders,
    customersCount,
    pendingCount,
    negativeCount,
    outOfStockCount,
    topProducts: topProductsRaw.map((p) => ({
      name: p.productNameSnapshot,
      sold: p._sum.quantity ?? 0,
    })),
    lowStockVariants: lowStockVariants.map((v) => ({
      id: v.id,
      productName: v.product.name,
      size: v.size,
      color: v.color,
      stock: v.stock,
    })),
    topCoupons: topCoupons.map((c) => ({
      code: c.code,
      usedCount: c.usedCount,
    })),
    recentOrders: recentOrdersRaw.map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.user?.name ?? o.guestEmail ?? "Khách vãng lai",
      status: o.status,
      totalAmount: Number(o.totalAmount),
    })),
    salesByCategory: salesByCategoryRaw.map((c) => ({
      label: c.category,
      value: Math.round((c.total / totalSalesForShare) * 100),
    })),
    revenueTrend: revenueTrendRaw.map((r) => ({
      label: r.day,
      value: r.total,
    })),
  };
}
