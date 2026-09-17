import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "recently_viewed";
const MAX_ITEMS = 10;

export async function getRecentlyViewedIds(excludeId?: string): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return [];

  try {
    const ids: unknown = JSON.parse(raw);
    if (!Array.isArray(ids)) return [];
    return ids.filter((id): id is string => typeof id === "string" && id !== excludeId).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}
