-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN "weightGrams" INTEGER NOT NULL DEFAULT 500;

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS');

-- AlterTable
ALTER TABLE "orders"
  ADD COLUMN "shippingCarrierFee" DECIMAL(12,2),
  ADD COLUMN "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "shipping_settings" (
  "id" TEXT NOT NULL,
  "freeShipThreshold" INTEGER NOT NULL DEFAULT 1000000,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipping_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "shipping_settings" ("id", "freeShipThreshold", "updatedAt")
VALUES ('singleton', 1000000, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
