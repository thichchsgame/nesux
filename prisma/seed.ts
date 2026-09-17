import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.shippingSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", freeShipThreshold: 1_000_000 },
  });

  // ---------- Category (5 cấp 1, không cha) ----------
  const outerwear = await prisma.category.upsert({
    where: { slug: "outerwear" },
    update: {},
    create: { name: "Áo khoác", slug: "outerwear" },
  });

  const tops = await prisma.category.upsert({
    where: { slug: "tops" },
    update: {},
    create: { name: "Áo", slug: "tops" },
  });

  const bottoms = await prisma.category.upsert({
    where: { slug: "bottoms" },
    update: {},
    create: { name: "Quần", slug: "bottoms" },
  });

  const footwear = await prisma.category.upsert({
    where: { slug: "footwear" },
    update: {},
    create: { name: "Giày", slug: "footwear" },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {},
    create: { name: "Phụ kiện", slug: "accessories" },
  });

  // ---------- Product + Variant + Image ----------
  const productsData = [
    {
      name: "Áo khoác dù Nexus Ripstop",
      slug: "ao-khoac-du-nexus-ripstop",
      description:
        "Áo khoác dù chất liệu ripstop chống nước nhẹ, form rộng rãi, phù hợp phối đồ streetwear hằng ngày.",
      basePrice: 890000,
      compareAtPrice: 1150000,
      categoryId: outerwear.id,
      attributes: {
        fit: "Oversized",
        fabric: "Ripstop",
        weight: 710,
        waterResistance: true,
        pockets: 4,
        origin: "VN",
      },
      tags: ["High collar", "Heavyweight loopback", "Technical drawcords"],
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
        "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80",
        "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80",
      ],
      variants: [
        {
          sku: "AKR-REU-S",
          size: "S",
          color: "Rêu xám",
          colorHex: "#565A3F",
          stock: 4,
        },
        {
          sku: "AKR-REU-M",
          size: "M",
          color: "Rêu xám",
          colorHex: "#565A3F",
          stock: 7,
        },
        {
          sku: "AKR-REU-L",
          size: "L",
          color: "Rêu xám",
          colorHex: "#565A3F",
          stock: 6,
        },
        {
          sku: "AKR-REU-XL",
          size: "XL",
          color: "Rêu xám",
          colorHex: "#565A3F",
          stock: 3,
        },
        {
          sku: "AKR-DEN-M",
          size: "M",
          color: "Đen",
          colorHex: "#211D17",
          stock: 10,
        },
        {
          sku: "AKR-DEN-L",
          size: "L",
          color: "Đen",
          colorHex: "#211D17",
          stock: 5,
        },
        {
          sku: "AKR-DO-M",
          size: "M",
          color: "Đỏ",
          colorHex: "#A03A2C",
          stock: 8,
        },
      ],
    },
    {
      name: "Quần cargo dáng suông",
      slug: "quan-cargo-dang-suong",
      description:
        "Quần cargo nhiều túi hộp, chất vải cotton pha, dáng suông thoải mái, dễ phối đồ.",
      basePrice: 490000,
      compareAtPrice: 650000,
      categoryId: bottoms.id,
      attributes: {
        fit: "Straight",
        fabric: "Cotton blend",
        waistType: "Elastic",
        pockets: 6,
        origin: "VN",
      },
      tags: ["Cargo pockets", "Relaxed fit", "Everyday utility"],
      images: [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
        "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&q=80",
        "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
      ],
      variants: [
        {
          sku: "QCG-NAU-M",
          size: "M",
          color: "Nâu",
          colorHex: "#565a3f",
          stock: 10,
        },
        {
          sku: "QCG-XAM-L",
          size: "L",
          color: "Xám",
          colorHex: "#808080",
          stock: 6,
        },
      ],
    },
    {
      name: "Áo thun form rộng basics",
      slug: "ao-thun-form-rong-basics",
      description:
        "Áo thun cotton form rộng, hoạ tiết trơn tối giản, chất vải dày dặn không xù lông sau giặt.",
      basePrice: 320000,
      compareAtPrice: null,
      categoryId: tops.id,
      attributes: {
        fit: "Oversized",
        fabric: "Cotton",
        weight: 320,
        origin: "VN",
      },
      tags: ["Heavyweight cotton", "Minimal basics", "Drop shoulder"],
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
      ],
      variants: [
        {
          sku: "ATB-TRANG-S",
          size: "S",
          color: "Trắng",
          colorHex: "#FFFFFF",
          stock: 15,
        },
        {
          sku: "ATB-DEN-M",
          size: "M",
          color: "Đen",
          colorHex: "#211D17",
          stock: 20,
        },
        {
          sku: "ATB-DO-M",
          size: "M",
          color: "Đỏ",
          colorHex: "#C0392B",
          stock: 7,
        },
      ],
    },
    {
      name: "Túi đeo chéo kỹ thuật",
      slug: "tui-deo-cheo-ky-thuat",
      description:
        "Túi đeo chéo chất liệu chống nước, nhiều ngăn, phù hợp đi làm hoặc đi chơi hằng ngày.",
      basePrice: 450000,
      compareAtPrice: null,
      categoryId: accessories.id,
      attributes: {
        material: "Nylon",
        accessoryType: "Túi đeo chéo",
        capacity: "3L",
        strapType: "Điều chỉnh",
        origin: "VN",
      },
      tags: ["Water resistant", "Multiple compartments", "Adjustable strap"],
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
      ],
      variants: [
        {
          sku: "TDC-DEN-FREE",
          size: null,
          color: "Đen",
          colorHex: "#211D17",
          stock: 25,
        },
      ],
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        attributes: p.attributes ?? undefined,
        tags: p.tags ?? [],
        images: {
          deleteMany: {},
          create: p.images.map((url, i) => ({ url, position: i })),
        },
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        status: "PUBLISHED",
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? undefined,
        attributes: p.attributes ?? undefined,
        tags: p.tags ?? [],
        categoryId: p.categoryId,
        images: {
          create: p.images.map((url, i) => ({ url, position: i })),
        },
      },
    });

    // Xoá hết variant cũ của product này trước khi tạo lại theo bộ mới
    await prisma.productVariant.deleteMany({
      where: { productId: product.id },
    });

    for (const v of p.variants) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          size: v.size ?? undefined,
          color: v.color ?? undefined,
          colorHex: v.colorHex ?? undefined,
          stock: v.stock,
        },
      });
    }
  }

  console.log("Seed xong:", productsData.length, "sản phẩm.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
