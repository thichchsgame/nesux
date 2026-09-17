import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { getOrderByNumber } from "@/lib/orders";
import { createSupportTicket, supportTopicLabel } from "@/lib/support";
import {
  searchProductsForChat,
  addVariantToCart,
  getCartSummary,
  type ProductCardData,
  type CartSummary,
} from "@/lib/shopping";
import type { SupportTicketTopic } from "@/app/generated/prisma/enums";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = process.env.AI_MODEL ?? "gemini-3.6-flash";
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite";

type Identity = { userId?: string; guestEmail?: string };
export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatBlock =
  | { type: "text"; role: "assistant"; content: string }
  | { type: "products"; products: ProductCardData[] }
  | { type: "cart"; cart: CartSummary }
  | { type: "actions"; actions: ("VIEW_CART" | "CHECKOUT")[] };

const SYSTEM_PROMPT = `Bạn là trợ lý mua sắm & hỗ trợ của NEXUS (cửa hàng thời trang utility wear).
Chỉ trả lời dựa trên dữ liệu lấy được từ tool được cung cấp — KHÔNG bịa thông tin về
chính sách đổi trả, thời gian giao hàng, khuyến mãi, hay đặc điểm sản phẩm nếu không chắc chắn.

Khi khách muốn mua/thêm sản phẩm vào giỏ:
- Nếu sản phẩm có NHIỀU size/màu, PHẢI hỏi khách chọn rõ size và màu trước khi gọi add_to_cart —
  TUYỆT ĐỐI không tự đoán thay khách.
- Chỉ gọi add_to_cart với variantId lấy từ kết quả search_products trong cuộc trò chuyện này,
  không tự bịa variantId.
- KHÔNG được tự tạo đơn hàng hay tự chuyển sang thanh toán thay khách. Sau khi thêm vào giỏ,
  chỉ gợi ý khách tiếp tục đến trang giỏ hàng/checkout để tự xác nhận địa chỉ, phí ship, thanh toán.

Nếu câu hỏi cần người thật xử lý (khiếu nại, đổi/trả hàng, sự cố đơn hàng phức tạp, hoặc bạn
không tự giải quyết được), hãy gọi tool create_ticket để chuyển cho nhân viên, đừng tự hứa hẹn
thay NEXUS. Trả lời ngắn gọn, tiếng Việt, giọng thân thiện.`;

const tools: any = [
  {
    functionDeclarations: [
      {
        name: "search_products",
        description:
          "Tìm sản phẩm đang bán theo tên hoặc từ khoá, trả về kèm danh sách variant (size/màu/tồn kho).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "Từ khoá tìm kiếm" },
          },
          required: ["query"],
        },
      },
      {
        name: "lookup_order",
        description: "Tra cứu trạng thái đơn hàng của CHÍNH khách đang chat.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            orderNumber: {
              type: Type.STRING,
              description: "Mã đơn, VD NEXUS-20260916-XXXXX",
            },
          },
          required: ["orderNumber"],
        },
      },
      {
        name: "add_to_cart",
        description:
          "Thêm 1 biến thể sản phẩm cụ thể (variantId lấy từ search_products) vào giỏ hàng của khách.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            variantId: { type: Type.STRING },
            quantity: { type: Type.INTEGER },
          },
          required: ["variantId", "quantity"],
        },
      },
      {
        name: "get_cart",
        description: "Xem tóm tắt giỏ hàng hiện tại của khách.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "create_ticket",
        description:
          "Tạo yêu cầu hỗ trợ để nhân viên NEXUS xử lý khi AI không tự giải quyết được.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            topic: {
              type: Type.STRING,
              enum: ["GENERAL", "ORDER", "PAYMENT", "ACCOUNT"],
            },
            summary: {
              type: Type.STRING,
              description:
                "Tóm tắt vấn đề của khách để bàn giao cho nhân viên.",
            },
          },
          required: ["topic", "summary"],
        },
      },
    ],
  },
];

async function runTool(
  name: string,
  args: Record<string, unknown>,
  identity: Identity,
) {
  if (name === "search_products") {
    const products = await searchProductsForChat(String(args.query ?? ""));
    return { products };
  }

  if (name === "lookup_order") {
    try {
      const order = await getOrderByNumber(
        String(args.orderNumber ?? ""),
        identity,
      );
      if (!order) return { error: "Không tìm thấy đơn hàng." };
      return {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingCode: order.trackingCode,
        totalAmount: Number(order.totalAmount),
      };
    } catch {
      return { error: "Không có quyền xem đơn hàng này." };
    }
  }

  if (name === "add_to_cart") {
    return addVariantToCart(
      identity,
      String(args.variantId ?? ""),
      Number(args.quantity ?? 1),
    );
  }

  if (name === "get_cart") {
    return { cart: await getCartSummary(identity) };
  }

  if (name === "create_ticket") {
    const topic = args.topic as SupportTicketTopic;
    const ticket = await createSupportTicket(identity, {
      topic,
      message: String(args.summary ?? ""),
    });
    return { ticketId: ticket.id, topicLabel: supportTopicLabel[topic] };
  }

  return { error: "Không hỗ trợ tool này." };
}

function isRetryableError(e: unknown): boolean {
  const err = e as { status?: number; message?: string };
  return (
    err?.status === 503 ||
    err?.status === 429 ||
    (typeof err?.message === "string" && err.message.includes("high demand"))
  );
}

async function generateContentWithRetry(params: {
  contents: Parameters<typeof ai.models.generateContent>[0]["contents"];
  config: Parameters<typeof ai.models.generateContent>[0]["config"];
}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await ai.models.generateContent({ model: MODEL, ...params });
    } catch (e) {
      if (!isRetryableError(e)) throw e;
      lastError = e;
      const delay = 500 * 2 ** attempt + Math.random() * 250;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  try {
    return await ai.models.generateContent({
      model: FALLBACK_MODEL,
      ...params,
    });
  } catch (e) {
    throw isRetryableError(e) ? lastError : e;
  }
}

function buildBlocks(
  text: string,
  toolResults: { name: string; result: any }[],
): ChatBlock[] {
  const blocks: ChatBlock[] = [
    { type: "text", role: "assistant", content: text },
  ];

  const productResult = toolResults.find(
    (tool) => tool.name === "search_products" && tool.result?.products?.length,
  );
  if (productResult)
    blocks.push({ type: "products", products: productResult.result.products });

  const cartResult = [...toolResults]
    .reverse()
    .find(
      (tool) =>
        (tool.name === "add_to_cart" || tool.name === "get_cart") &&
        tool.result?.cart,
    );
  if (cartResult) {
    blocks.push({ type: "cart", cart: cartResult.result.cart });
    blocks.push({ type: "actions", actions: ["VIEW_CART", "CHECKOUT"] });
  }

  return blocks;
}

export async function runSupportAssistant(
  history: ChatMessage[],
  identity: Identity,
) {
  const contents = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  let createdTicketId: string | null = null;
  const toolResults: { name: string; result: any }[] = [];

  for (let step = 0; step < 4; step++) {
    const response = await generateContentWithRetry({
      contents,
      config: { systemInstruction: SYSTEM_PROMPT, tools },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      return {
        blocks: buildBlocks(response.text ?? "", toolResults),
        ticketId: createdTicketId,
      };
    }

    const modelContent: any = response.candidates?.[0]?.content;
    if (!modelContent) throw new Error("Gemini không trả về content hợp lệ.");
    contents.push(modelContent as any);

    const responseParts: any[] = [];
    for (const call of calls) {
      const result = await runTool(call.name!, call.args ?? {}, identity);
      toolResults.push({ name: call.name!, result });
      if (call.name === "create_ticket" && "ticketId" in result) {
        createdTicketId = result.ticketId as string;
      }
      responseParts.push({
        functionResponse: { name: call.name, response: result },
      });
    }
    contents.push({ role: "user", parts: responseParts as any });
  }

  return {
    blocks: buildBlocks(
      "Xin lỗi, mình chưa xử lý được yêu cầu này ngay. Bạn đợi nhân viên hỗ trợ nhé.",
      toolResults,
    ),
    ticketId: createdTicketId,
  };
}
