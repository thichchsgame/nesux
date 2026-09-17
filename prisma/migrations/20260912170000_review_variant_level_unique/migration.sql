-- Existing development/test reviews must be removed before applying this migration:
-- DELETE FROM "review_media";
-- DELETE FROM "reviews";
-- A legacy review cannot be safely assigned a variant when its orderItemId is null.

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "variantSkuSnapshot" TEXT NOT NULL,
ADD COLUMN "colorSnapshot" TEXT,
ADD COLUMN "sizeSnapshot" TEXT;

ALTER TABLE "reviews" ALTER COLUMN "isVerifiedPurchase" SET DEFAULT true;

-- Drop the product-level constraint and create the variant-level equivalent.
DROP INDEX "reviews_productId_userId_key";
CREATE UNIQUE INDEX "reviews_productId_userId_variantSkuSnapshot_key" ON "reviews"("productId", "userId", "variantSkuSnapshot");
