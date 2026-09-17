import "server-only";
import { uploadReviewMedia } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

const MAX_REVIEW_MEDIA = 5;
const MAX_COMMENT_LENGTH = 2000;

function validateComment(comment?: string | null): string | null {
  const trimmed = comment?.trim() || null;
  if (trimmed && trimmed.length > MAX_COMMENT_LENGTH) throw new Error(`Nội dung đánh giá tối đa ${MAX_COMMENT_LENGTH} ký tự.`);
  return trimmed;
}

function validateMediaFiles(files?: File[]): File[] {
  const mediaFiles = (files ?? []).filter((file) => file.size > 0);
  if (mediaFiles.length > MAX_REVIEW_MEDIA) throw new Error(`Chỉ được đính kèm tối đa ${MAX_REVIEW_MEDIA} ảnh/video.`);
  return mediaFiles;
}

/** Các lần mua theo biến thể chưa có review; mỗi biến thể giữ lần mua mới nhất. */
export async function getReviewablePurchases(userId: string, productId: string) {
  const items = await prisma.orderItem.findMany({
    where: { variant: { productId }, order: { userId, status: "DELIVERED" } },
    orderBy: { order: { updatedAt: "desc" } },
    select: { id: true, variantSkuSnapshot: true, colorSnapshot: true, sizeSnapshot: true },
  });
  const seenSku = new Set<string>();
  const dedupedByVariant = items.filter((item) => {
    if (seenSku.has(item.variantSkuSnapshot)) return false;
    seenSku.add(item.variantSkuSnapshot);
    return true;
  });
  const alreadyReviewed = await prisma.review.findMany({ where: { productId, userId }, select: { variantSkuSnapshot: true } });
  const reviewedSkus = new Set(alreadyReviewed.map((review) => review.variantSkuSnapshot));
  return dedupedByVariant.filter((item) => !reviewedSkus.has(item.variantSkuSnapshot));
}

export async function getUserReviewsForProduct(userId: string, productId: string) {
  return prisma.review.findMany({ where: { productId, userId }, include: { media: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "desc" } });
}

export async function createReview(userId: string, productId: string, orderItemId: string, data: { rating: number; comment?: string | null }, files?: File[]) {
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) throw new Error("Đánh giá phải từ 1 đến 5 sao.");
  const item = await prisma.orderItem.findFirst({ where: { id: orderItemId, variant: { productId }, order: { userId, status: "DELIVERED" } } });
  if (!item) throw new Error("Không tìm thấy giao dịch hợp lệ để đánh giá sản phẩm/biến thể này.");
  const existing = await prisma.review.findUnique({ where: { productId_userId_variantSkuSnapshot: { productId, userId, variantSkuSnapshot: item.variantSkuSnapshot } } });
  if (existing) throw new Error("Bạn đã đánh giá biến thể này rồi.");

  const uploaded = await Promise.all(validateMediaFiles(files).map((file) => uploadReviewMedia(file, `nexus/reviews/${productId}`)));
  return prisma.review.create({
    data: {
      productId, userId, orderItemId: item.id, variantSkuSnapshot: item.variantSkuSnapshot,
      colorSnapshot: item.colorSnapshot, sizeSnapshot: item.sizeSnapshot, rating: data.rating,
      comment: validateComment(data.comment), isVerifiedPurchase: true,
      media: { create: uploaded.map((media, position) => ({ url: media.url, type: media.type, position })) },
    },
  });
}

/** Nếu chọn media mới, thay thế toàn bộ media hiện có; để trống thì giữ nguyên media cũ. */
export async function updateReview(reviewId: string, userId: string, data: { rating: number; comment?: string | null }, files?: File[]) {
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) throw new Error("Đánh giá phải từ 1 đến 5 sao.");
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== userId) throw new Error("Không tìm thấy đánh giá.");

  const mediaFiles = validateMediaFiles(files);
  const uploaded = mediaFiles.length
    ? await Promise.all(mediaFiles.map((file) => uploadReviewMedia(file, `nexus/reviews/${review.productId}`)))
    : null;
  return prisma.$transaction(async (tx) => {
    if (uploaded) {
      await tx.reviewMedia.deleteMany({ where: { reviewId } });
      await tx.reviewMedia.createMany({ data: uploaded.map((media, position) => ({ reviewId, url: media.url, type: media.type, position })) });
    }
    return tx.review.update({
      where: { id: reviewId },
      data: { rating: data.rating, comment: validateComment(data.comment), editedAt: new Date(), adminReply: null, adminRepliedAt: null, adminRepliedById: null },
    });
  });
}

/** Hard delete để giải phóng unique key, cho phép review lại biến thể. */
export async function deleteReview(reviewId: string, userId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== userId) throw new Error("Không tìm thấy đánh giá.");
  await prisma.review.delete({ where: { id: reviewId } });
}

export async function setReviewStatus(reviewId: string, status: "PUBLISHED" | "HIDDEN") {
  return prisma.review.update({ where: { id: reviewId }, data: { status } });
}

export async function replyToReview(reviewId: string, adminId: string, reply: string) {
  const trimmed = reply.trim();
  if (!trimmed) throw new Error("Nội dung trả lời không được để trống.");
  return prisma.review.update({ where: { id: reviewId }, data: { adminReply: trimmed, adminRepliedAt: new Date(), adminRepliedById: adminId } });
}

export async function removeReply(reviewId: string) {
  return prisma.review.update({ where: { id: reviewId }, data: { adminReply: null, adminRepliedAt: null, adminRepliedById: null } });
}

export async function listReviewsForAdmin(params?: { page?: number; pageSize?: number }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 30;
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } }, media: { orderBy: { position: "asc" } } },
    }),
    prisma.review.count(),
  ]);
  return { reviews, total, page, pageSize };
}
