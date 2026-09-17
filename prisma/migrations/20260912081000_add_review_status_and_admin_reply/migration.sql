-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- AlterTable
ALTER TABLE "reviews"
  ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "adminReply" TEXT,
  ADD COLUMN "adminRepliedAt" TIMESTAMP(3),
  ADD COLUMN "adminRepliedById" TEXT;

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_adminRepliedById_fkey"
  FOREIGN KEY ("adminRepliedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
