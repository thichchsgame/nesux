import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/app/generated/prisma/enums";

export const runtime = "nodejs";

const GHN_STATUS_MAP: Record<string, OrderStatus> = {
  ready_to_pick: "PROCESSING",
  picking: "PROCESSING",
  picked: "SHIPPED",
  storing: "SHIPPED",
  transporting: "SHIPPED",
  sorting: "SHIPPED",
  delivering: "SHIPPED",
  delivered: "DELIVERED",
  return: "CANCELLED",
  returned: "CANCELLED",
  cancel: "CANCELLED",
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!process.env.GHN_WEBHOOK_TOKEN || token !== process.env.GHN_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let payload: { OrderCode?: string; Status?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.OrderCode || !payload.Status) return NextResponse.json({ ok: true });
  const mappedStatus = GHN_STATUS_MAP[payload.Status];
  if (!mappedStatus) return NextResponse.json({ ok: true });

  const order = await prisma.order.findFirst({
    where: { trackingCode: payload.OrderCode },
  });
  if (!order || order.status === mappedStatus) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: mappedStatus },
    }),
    prisma.orderStatusEvent.create({
      data: {
        orderId: order.id,
        status: mappedStatus,
        note: `GHN webhook: ${payload.Status}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
