import "server-only";

import { prisma } from "@/lib/prisma";

const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 2000;

function validateQuestion(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) throw new Error("Vui lòng nhập nội dung câu hỏi.");
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    throw new Error(`Câu hỏi tối đa ${MAX_QUESTION_LENGTH} ký tự.`);
  }
  return trimmed;
}

function validateAnswer(answer: string): string {
  const trimmed = answer.trim();
  if (!trimmed) throw new Error("Nội dung trả lời không được để trống.");
  if (trimmed.length > MAX_ANSWER_LENGTH) {
    throw new Error(`Câu trả lời tối đa ${MAX_ANSWER_LENGTH} ký tự.`);
  }
  return trimmed;
}

const productSlug = { product: { select: { slug: true } } } as const;

export async function createQuestion(userId: string, productId: string, question: string) {
  return prisma.productQuestion.create({
    data: { productId, userId, question: validateQuestion(question) },
  });
}

export async function updateQuestion(questionId: string, userId: string, question: string) {
  const existing = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!existing || existing.userId !== userId) throw new Error("Không tìm thấy câu hỏi.");

  return prisma.productQuestion.update({
    where: { id: questionId },
    data: {
      question: validateQuestion(question),
      editedAt: new Date(),
      answer: null,
      answeredAt: null,
      answeredById: null,
    },
  });
}

export async function deleteQuestion(questionId: string, userId: string) {
  const existing = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!existing || existing.userId !== userId) throw new Error("Không tìm thấy câu hỏi.");
  await prisma.productQuestion.delete({ where: { id: questionId } });
}

export async function setQuestionStatus(questionId: string, status: "PUBLISHED" | "HIDDEN") {
  return prisma.productQuestion.update({ where: { id: questionId }, data: { status }, include: productSlug });
}

export async function answerQuestion(questionId: string, adminId: string, answer: string) {
  return prisma.productQuestion.update({
    where: { id: questionId },
    data: { answer: validateAnswer(answer), answeredAt: new Date(), answeredById: adminId },
    include: productSlug,
  });
}

export async function removeAnswer(questionId: string) {
  return prisma.productQuestion.update({
    where: { id: questionId },
    data: { answer: null, answeredAt: null, answeredById: null },
    include: productSlug,
  });
}

export async function listQuestionsForProduct(productId: string, limit = 20) {
  return prisma.productQuestion.findMany({
    where: { productId, status: "PUBLISHED", answer: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });
}

/** Câu hỏi của chính user — hiện cả khi chưa có trả lời để họ biết đã gửi thành công. */
export async function getUserQuestionsForProduct(userId: string, productId: string) {
  return prisma.productQuestion.findMany({
    where: { productId, userId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
}

export async function listQuestionsForAdmin(params?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 30));
  const [questions, total] = await Promise.all([
    prisma.productQuestion.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.productQuestion.count(),
  ]);
  return { questions, total, page, pageSize };
}
