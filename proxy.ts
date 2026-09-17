import { NextResponse, type NextRequest } from "next/server";

const CART_COOKIE = "cart_session_token";

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(CART_COOKIE)?.value;
  const token = existing ?? crypto.randomUUID(); // Web Crypto API, không cần import

  request.cookies.set(CART_COOKIE, token);
  const response = NextResponse.next({ request });

  if (!existing) {
    response.cookies.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};