import "server-only";
import { auth } from "@/lib/auth";

export class SuspendedAccountError extends Error {
  constructor() {
    super("Tài khoản của bạn hiện không thể thực hiện thao tác này. Vui lòng liên hệ hỗ trợ.");
    this.name = "SuspendedAccountError";
  }
}

/** Trả về userId nếu đã đăng nhập và KHÔNG bị suspend. Throw nếu chưa đăng nhập hoặc bị khoá. */
export async function requireActiveUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Vui lòng đăng nhập.");
  if (session.user.suspended) throw new SuspendedAccountError();
  return session.user.id;
}
