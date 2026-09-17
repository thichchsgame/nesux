import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { mergeGuestCartIntoUserCart } from "@/lib/cart";
import { isEffectivelySuspended, syncSuspensionStatus } from "@/lib/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mat khau", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;
        if (isEffectivelySuspended(user)) return null; // không tiết lộ lý do, giống lỗi sai mật khẩu

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.id) {
        // Chặn MỌI provider (Google lẫn Credentials) — authorize() chỉ chạy cho Credentials,
        // Google OAuth phải check riêng ở đây.
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser && isEffectivelySuspended(dbUser)) return false;

        await mergeGuestCartIntoUserCart(user.id).catch((err) => {
          console.error("Gộp giỏ hàng thất bại:", err);
        });

        // Ghi "lần đăng nhập gần nhất" — cố ý đặt ở signIn (chạy 1 lần/lượt đăng nhập thật),
        // không đặt ở jwt callback (chạy mỗi lần session được đọc, sẽ ghi đè liên tục sai nghĩa).
        await prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch((err) => {
            console.error("Không thể cập nhật lastLoginAt:", err);
          });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Làm mới role + trạng thái suspend từ DB MỖI LẦN token được đọc lại (không chỉ lúc
      // đăng nhập lần đầu) — nhờ đó: (1) tài khoản bị khoá SAU KHI đã đăng nhập sẽ bị phát
      // hiện ở request tiếp theo, không phải chờ đăng xuất/đăng nhập lại; (2) đổi role trong
      // DB cũng có hiệu lực gần như ngay, không cần user tự đăng xuất/vào lại như trước đây.
      // Đánh đổi: tốn 1 query DB mỗi lần session được đọc — chấp nhận được ở quy mô hiện tại,
      // có thể cache lại (Redis) ở Phase 11 nếu ảnh hưởng hiệu năng thật.
      if (token.id) {
        const dbUser = await syncSuspensionStatus(token.id as string);
        if (dbUser) {
          token.role = dbUser.role;
          token.suspended = isEffectivelySuspended(dbUser);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN";
        session.user.suspended = (token.suspended as boolean) ?? false;
      }
      return session;
    },
  },
});
