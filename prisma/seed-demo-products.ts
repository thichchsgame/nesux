import "dotenv/config";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "../app/generated/prisma/client.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary credentials are required.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const imageDir = path.join(process.cwd(), "scripts", "demo-images");

async function uploadLocal(filename: string, folder: string) {
  const result = await cloudinary.uploader.upload(path.join(imageDir, filename), { folder, resource_type: "image" });
  return result.secure_url;
}

type DemoProduct = {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  categorySlug: string;
  attributes: Record<string, string | number | boolean>;
  tags: string[];
  heroTagline: string;
  images: string[];
  variants: { sku: string; size: string | null; color: string; colorHex: string; stock: number }[];
};

// Demo catalogue data only. Do not use these product claims or prices in production.
const demoProducts: DemoProduct[] = [
  {
    name: "Utility Shell Jacket", slug: "utility-shell-jacket", description: "Áo khoác chống gió cho di chuyển đô thị, form oversized, hệ túi modular, đường may kín nước.", basePrice: 990000, compareAtPrice: 1290000, categorySlug: "outerwear",
    attributes: { fit: "Oversized", fabric: "Nylon 88%", weight: 620, waterResistance: true, pockets: 6, origin: "VN" }, tags: ["Wind resistant", "Modular pockets", "Sealed seams"], heroTagline: "Water / Wind / City", images: ["shell-front.png", "shell-back.png", "shell-detail.png"],
    variants: [{ sku: "USJ-BLK-M", size: "M", color: "Đen", colorHex: "#111112", stock: 8 }, { sku: "USJ-BLK-L", size: "L", color: "Đen", colorHex: "#111112", stock: 6 }, { sku: "USJ-GRA-M", size: "M", color: "Graphite", colorHex: "#3a3a3c", stock: 5 }],
  },
  {
    name: "Modular Cargo Pants", slug: "modular-cargo-pants", description: "Quần cargo ống rộng, dây đai điều chỉnh, túi hộp sâu, form relaxed, bo hẹp gấu.", basePrice: 690000, compareAtPrice: null, categorySlug: "bottoms",
    attributes: { fit: "Wide leg", fabric: "Cotton twill", waistType: "Adjustable strap", pockets: 7, origin: "VN" }, tags: ["Adjustable straps", "Deep cargo pockets", "Relaxed fit"], heroTagline: "Carry / Adapt / Repeat", images: ["cargo.png", "techpants.png"],
    variants: [{ sku: "MCP-BLK-M", size: "M", color: "Đen", colorHex: "#111112", stock: 10 }, { sku: "MCP-SAND-L", size: "L", color: "Sand", colorHex: "#c9bfae", stock: 7 }],
  },
  {
    name: "Signal Tech Hoodie", slug: "signal-tech-hoodie", description: "Hoodie zip cổ cao, lót brushed mềm, dây rút kỹ thuật, thiết kế để layer.", basePrice: 590000, compareAtPrice: null, categorySlug: "tops",
    attributes: { fit: "Regular", fabric: "Cotton loopback 420gsm", weight: 480, origin: "VN" }, tags: ["High collar", "Heavyweight loopback", "Technical drawcords"], heroTagline: "Soft / Technical / Layered", images: ["hoodie.png"],
    variants: [{ sku: "STH-BLK-S", size: "S", color: "Đen", colorHex: "#111112", stock: 12 }, { sku: "STH-BLK-M", size: "M", color: "Đen", colorHex: "#111112", stock: 15 }, { sku: "STH-ASH-M", size: "M", color: "Ash", colorHex: "#8a8a8a", stock: 6 }],
  },
  {
    name: "System Runner Sneakers", slug: "system-runner-sneakers", description: "Sneaker kỹ thuật, thân suede kết hợp mesh, đế cao su vulcanized bám tốt, phối đồ hằng ngày.", basePrice: 1290000, compareAtPrice: null, categorySlug: "footwear",
    attributes: { fit: "Regular", upperMaterial: "Suede & Mesh", liningMaterial: "Mesh", outsoleMaterial: "Vulcanized Rubber", closure: "Lace-up", weight: 420, origin: "VN" }, tags: ["Suede upper", "Padded collar", "Vulcanized sole"], heroTagline: "Grip / Impact / Motion", images: ["sneakers.png"],
    variants: [{ sku: "SRS-BLK-40", size: "40", color: "Đen", colorHex: "#111112", stock: 9 }, { sku: "SRS-BLK-41", size: "41", color: "Đen", colorHex: "#111112", stock: 11 }, { sku: "SRS-BLK-42", size: "42", color: "Đen", colorHex: "#111112", stock: 7 }],
  },
  {
    name: "Chest Rig Accessory", slug: "chest-rig-accessory", description: "Túi đeo ngực kiểu tactical, nhiều ngăn, quai điều chỉnh nhanh, phối tốt với outerwear hệ thống.", basePrice: 450000, compareAtPrice: null, categorySlug: "accessories",
    attributes: { material: "Cordura Nylon", accessoryType: "Chest rig", capacity: "2L", strapType: "Quick-release", origin: "VN" }, tags: ["Quick release", "Modular straps", "Water resistant"], heroTagline: "Carry / Access / Adapt", images: ["accessories.png"],
    variants: [{ sku: "CRA-BLK-FREE", size: null, color: "Đen", colorHex: "#111112", stock: 20 }],
  },
];

async function main() {
  for (const data of demoProducts) {
    const category = await prisma.category.findUnique({ where: { slug: data.categorySlug } });
    if (!category) {
      console.warn(`Skipping ${data.name}: category ${data.categorySlug} was not found.`);
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
    const imageUrls = existing
      ? []
      : await Promise.all(data.images.map((image) => uploadLocal(image, `nexus/products/${data.slug}`)));
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name, description: data.description, status: "PUBLISHED", categoryId: category.id,
        basePrice: data.basePrice, compareAtPrice: data.compareAtPrice, attributes: data.attributes, tags: data.tags, heroTagline: data.heroTagline,
      },
      create: {
        name: data.name, slug: data.slug, description: data.description, status: "PUBLISHED", categoryId: category.id,
        basePrice: data.basePrice, compareAtPrice: data.compareAtPrice ?? undefined, attributes: data.attributes, tags: data.tags, heroTagline: data.heroTagline,
        images: { create: imageUrls.map((url, position) => ({ url, position })) },
      },
    });

    if (!existing) {
      await prisma.productVariant.createMany({
        data: data.variants.map((variant) => ({ productId: product.id, ...variant })),
      });
    }
    console.log(`✓ ${data.name}: ${existing ? "metadata updated" : `${imageUrls.length} images uploaded`}.`);
  }
  console.log(`Done: ${demoProducts.length} demo products processed.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
