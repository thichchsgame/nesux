import { NextResponse } from "next/server";
import { cleanupExpiredPendingOrders } from "@/lib/orders";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await cleanupExpiredPendingOrders(30);
  return NextResponse.json({ ok: true, ...result });
}
