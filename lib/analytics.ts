import "server-only";
import { prisma } from "@/lib/prisma";
import { orderStatusLabel } from "@/lib/order-status";
import type { OrderStatus } from "@/app/generated/prisma/enums";

const SUCCESS_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "border-amber-300/30 text-amber-300",
  PAID: "border-sky-300/30 text-sky-300",
  PROCESSING: "border-sky-300/30 text-sky-300",
  SHIPPED: "border-sky-300/30 text-sky-300",
  DELIVERED: "border-emerald-300/30 text-emerald-300",
  CANCELLED: "border-red-300/30 text-red-300",
  REFUNDED: "border-purple-300/30 text-purple-300",
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function pctDelta(current: number, previous: number): string | undefined {
  if (previous === 0) return current > 0 ? "+100%" : undefined;
  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

export async function getAnalyticsOverview(days: number) {
  const since = daysAgo(days);
  const prevSince = daysAgo(days * 2);
  const isDaily = days <= 30;

  const [
    currentAgg,
    previousAgg,
    statusCounts,
    topByUnits,
    topByRevenue,
    salesByCategoryRaw,
    revenueTrendRaw,
    customersWithOrder,
    customersWithRepeatOrder,
    topCoupons,
    lowStockVariants,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: SUCCESS_STATUSES }, createdAt: { gte: since } },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        status: { in: SUCCESS_STATUSES },
        createdAt: { gte: prevSince, lt: since },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["productNameSnapshot"],
      where: {
        order: { status: { in: SUCCESS_STATUSES }, createdAt: { gte: since } },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["productNameSnapshot"],
      where: {
        order: { status: { in: SUCCESS_STATUSES }, createdAt: { gte: since } },
      },
      _sum: { lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.$queryRaw<{ category: string; total: number }[]>`
      SELECT c.name AS category, SUM(oi."lineTotal")::float AS total
      FROM "order_items" oi
      JOIN "orders" o ON o.id = oi."orderId"
      JOIN "product_variants" v ON v.id = oi."variantId"
      JOIN "products" p ON p.id = v."productId"
      JOIN "categories" c ON c.id = p."categoryId"
      WHERE o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED') AND o."createdAt" >= ${since}
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 6;
    `,
    isDaily
      ? prisma.$queryRaw<{ label: string; value: number }[]>`
          SELECT to_char(date_trunc('day', "createdAt"), 'DD/MM') AS label, SUM("totalAmount")::float AS value
          FROM "orders"
          WHERE status IN ('PAID','PROCESSING','SHIPPED','DELIVERED') AND "createdAt" >= ${since}
          GROUP BY 1, date_trunc('day', "createdAt")
          ORDER BY date_trunc('day', "createdAt") ASC;
        `
      : prisma.$queryRaw<{ label: string; value: number }[]>`
          SELECT to_char(date_trunc('month', "createdAt"), 'MM/YYYY') AS label, SUM("totalAmount")::float AS value
          FROM "orders"
          WHERE status IN ('PAID','PROCESSING','SHIPPED','DELIVERED') AND "createdAt" >= ${since}
          GROUP BY 1, date_trunc('month', "createdAt")
          ORDER BY date_trunc('month', "createdAt") ASC;
        `,
    prisma.order
      .findMany({
        where: { userId: { not: null }, createdAt: { gte: since } },
        distinct: ["userId"],
        select: { userId: true },
      })
      .then((r) => r.length),
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "userId" FROM "orders"
        WHERE "userId" IS NOT NULL AND "createdAt" >= ${since}
        GROUP BY "userId"
        HAVING COUNT(*) >= 2
      ) t;
    `,
    prisma.coupon.findMany({
      where: { usedCount: { gt: 0 } },
      orderBy: { usedCount: "desc" },
      take: 5,
      select: { code: true, usedCount: true },
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  const totalRevenue = Number(currentAgg._sum.totalAmount ?? 0);
  const totalOrders = currentAgg._count;
  const aov = Number(currentAgg._avg.totalAmount ?? 0);
  const prevRevenue = Number(previousAgg._sum.totalAmount ?? 0);
  const prevOrders = previousAgg._count;

  const statusTotal = statusCounts.reduce((sum, s) => sum + s._count, 0) || 1;
  const ordersByStatus = statusCounts
    .map((s) => ({
      status: s.status,
      label: orderStatusLabel[s.status],
      value: Math.round((s._count / statusTotal) * 100),
      tone: STATUS_TONE[s.status],
    }))
    .sort((a, b) => b.value - a.value);

  const totalCategorySales =
    salesByCategoryRaw.reduce((sum, c) => sum + c.total, 0) || 1;
  const salesByCategory = salesByCategoryRaw.map((c) => ({
    label: c.category,
    value: Math.round((c.total / totalCategorySales) * 100),
  }));

  const repeatCount = customersWithRepeatOrder[0]?.count ?? 0;
  const returningRate =
    customersWithOrder > 0
      ? Math.round((repeatCount / customersWithOrder) * 100)
      : 0;

  return {
    totalRevenue,
    totalOrders,
    aov,
    revenueDelta: pctDelta(totalRevenue, prevRevenue),
    ordersDelta: pctDelta(totalOrders, prevOrders),
    returningRate,
    revenueTrend: revenueTrendRaw.map((r) => ({
      label: r.label,
      value: r.value,
    })),
    ordersByStatus,
    topProducts: {
      "Số lượng": topByUnits.map((p) => ({
        label: p.productNameSnapshot,
        value: p._sum.quantity ?? 0,
      })),
      "Doanh thu": topByRevenue.map((p) => ({
        label: p.productNameSnapshot,
        value: Math.round(Number(p._sum.lineTotal ?? 0)),
      })),
    },
    salesByCategory,
    topCoupons: topCoupons.map((c) => ({ label: c.code, value: c.usedCount })),
    lowStockVariants: lowStockVariants.map((v) => ({
      label: `${v.product.name} ${[v.size, v.color].filter(Boolean).join("/")}`,
      value: v.stock,
    })),
  };
}
