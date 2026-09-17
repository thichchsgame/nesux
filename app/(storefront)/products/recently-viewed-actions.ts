"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "recently_viewed";
const MAX_ITEMS = 10;

export async function recordProductViewAction(productId: string) {
  if (!productId || productId.length > 100) return;

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  let ids: string[] = [];

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string");
    } catch {
      ids = [];
    }
  }

  ids = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
  store.set(COOKIE_NAME, JSON.stringify(ids), {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}
