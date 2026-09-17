// Thêm/merge phần `images` này vào next.config.ts hiện có của bạn.
// Nếu file đã có nội dung khác, chỉ cần thêm key "images" vào object cấu hình, không ghi đè cả file.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Five images at 5 MB each, plus multipart form overhead.
      bodySizeLimit: "105mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Sau này lưu ảnh thật lên Cloudflare R2 (theo tech_stack), nhớ thêm domain R2 vào đây,
      // ví dụ: { protocol: "https", hostname: "<bucket>.r2.dev" }
    ],
  },
};

export default nextConfig;
