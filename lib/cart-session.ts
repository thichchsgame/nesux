import "server-only";
import { cookies } from "next/headers";

const CART_COOKIE = "cart_session_token";

export async function getCartSessionToken(): Promise<string> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) {
    throw new Error("Thiếu cart session token — kiểm tra middleware.ts đã được tạo và đang chạy chưa.");
  }
  return token;
}