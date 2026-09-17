"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import {
  getSupportContextAction,
  createSupportTicketAction,
  sendCustomerMessageAction,
  getTicketThreadAction,
  addToCartAction,
} from "@/app/support-actions";

type ThreadMessage = {
  id: string;
  senderRole: "CUSTOMER" | "ADMIN";
  body: string;
  createdAt: string;
};

type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  variants: {
    id: string;
    size: string | null;
    color: string | null;
    stock: number;
  }[];
};

type CartSummary = {
  itemCount: number;
  subtotal: number;
  items: {
    variantId: string;
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

type ChatBlock =
  | { type: "text"; role: "user" | "assistant"; content: string }
  | { type: "products"; products: ProductCardData[] }
  | { type: "cart"; cart: CartSummary }
  | { type: "actions"; actions: ("VIEW_CART" | "CHECKOUT")[] };

const STORAGE_TICKET_KEY = "nexus_support_ticket_id";
const STORAGE_EMAIL_KEY = "nexus_support_guest_email";
const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

function ProductCard({
  product,
  onAdded,
}: {
  product: ProductCardData;
  onAdded: (block: ChatBlock[]) => void;
}) {
  const [size, setSize] = useState(product.variants[0]?.size ?? "");
  const [color, setColor] = useState(product.variants[0]?.color ?? "");
  const [adding, setAdding] = useState(false);

  const sizes = [
    ...new Set(product.variants.map((v) => v.size).filter(Boolean)),
  ] as string[];
  const colors = [
    ...new Set(product.variants.map((v) => v.color).filter(Boolean)),
  ] as string[];
  const matched = product.variants.find(
    (v) =>
      (sizes.length === 0 || v.size === size) &&
      (colors.length === 0 || v.color === color),
  );

  async function handleAdd() {
    if (!matched) return;
    setAdding(true);
    const res = await addToCartAction(matched.id, 1);
    setAdding(false);
    if (!res.ok) {
      onAdded([{ type: "text", role: "assistant", content: res.error }]);
      return;
    }
    onAdded([
      {
        type: "text",
        role: "assistant",
        content: `Đã thêm ${res.productName}${res.size ? ` — ${res.size}` : ""}${res.color ? `/${res.color}` : ""} vào giỏ.`,
      },
      { type: "cart", cart: res.cart },
      { type: "actions", actions: ["VIEW_CART", "CHECKOUT"] },
    ]);
  }

  return (
    <div className="w-full border border-border bg-background">
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          className="h-32 w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-2 p-3">
        <p className="text-[11px] text-foreground">{product.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {fmt.format(product.price)}
          {product.compareAtPrice && (
            <span className="ml-2 line-through">
              {fmt.format(product.compareAtPrice)}
            </span>
          )}
        </p>
        {sizes.length > 1 && (
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border border-border bg-background px-2 py-1.5 text-[10px] text-foreground"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        {colors.length > 1 && (
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border border-border bg-background px-2 py-1.5 text-[10px] text-foreground"
          >
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="flex-1 border border-border px-2 py-1.5 text-center text-[10px] uppercase tracking-[0.1em] text-foreground"
          >
            Xem
          </Link>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!matched || matched.stock === 0 || adding}
            className="flex-1 bg-primary px-2 py-1.5 text-[10px] uppercase tracking-[0.1em] text-primary-foreground disabled:opacity-40"
          >
            {matched && matched.stock === 0
              ? "Hết hàng"
              : adding
                ? "..."
                : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartBlockView({ cart }: { cart: CartSummary }) {
  return (
    <div className="w-full border border-border bg-background p-3 text-[11px]">
      <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Giỏ hàng ({cart.itemCount})
      </p>
      {cart.items.map((item) => (
        <div
          key={item.variantId}
          className="flex justify-between py-1 text-muted-foreground"
        >
          <span>
            {item.name} {item.size ? `- ${item.size}` : ""} × {item.quantity}
          </span>
          <span>{fmt.format(item.lineTotal)}</span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-border pt-2 text-foreground">
        <span>Tạm tính</span>
        <span>{fmt.format(cart.subtotal)}</span>
      </div>
    </div>
  );
}

function ActionsBlockView({
  actions,
}: {
  actions: ("VIEW_CART" | "CHECKOUT")[];
}) {
  return (
    <div className="flex gap-2">
      {actions.includes("VIEW_CART") && (
        <Link
          href="/cart"
          className="flex-1 border border-border px-3 py-2 text-center text-[10px] uppercase tracking-[0.1em] text-foreground"
        >
          Xem giỏ hàng
        </Link>
      )}
      {actions.includes("CHECKOUT") && (
        <Link
          href="/checkout"
          className="flex-1 bg-primary px-3 py-2 text-center text-[10px] uppercase tracking-[0.1em] text-primary-foreground"
        >
          Thanh toán
        </Link>
      )}
    </div>
  );
}

export function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [view, setView] = useState<"ai" | "thread" | "manual">("ai");

  const [ticketId, setTicketId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [threadStatus, setThreadStatus] = useState<"OPEN" | "RESOLVED" | null>(
    null,
  );

  const [aiHistory, setAiHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [aiBlocks, setAiBlocks] = useState<ChatBlock[]>([
    {
      type: "text",
      role: "assistant",
      content: "Chào bạn, mình có thể giúp gì?",
    },
  ]);
  const [aiDraft, setAiDraft] = useState("");
  const [aiEmail, setAiEmail] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [manualTopic, setManualTopic] = useState<
    "GENERAL" | "ORDER" | "PAYMENT" | "ACCOUNT"
  >("GENERAL");
  const [manualEmail, setManualEmail] = useState("");
  const [manualContent, setManualContent] = useState("");

  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const ctx = await getSupportContextAction();
      setLoggedIn(ctx.loggedIn);
      if (ctx.loggedIn && ctx.activeTicket) {
        setTicketId(ctx.activeTicket.id);
        setThreadStatus(ctx.activeTicket.status);
        setThreadMessages(ctx.activeTicket.messages);
        setView("thread");
      } else if (!ctx.loggedIn) {
        const savedId = localStorage.getItem(STORAGE_TICKET_KEY);
        const savedEmail = localStorage.getItem(STORAGE_EMAIL_KEY);
        if (savedId && savedEmail) {
          const res = await getTicketThreadAction(savedId, savedEmail);
          if (res.ok) {
            setTicketId(savedId);
            setGuestEmail(savedEmail);
            setThreadStatus(res.status);
            setThreadMessages(res.messages);
            setView("thread");
          } else {
            localStorage.removeItem(STORAGE_TICKET_KEY);
            localStorage.removeItem(STORAGE_EMAIL_KEY);
          }
        }
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!open || view !== "thread" || !ticketId) return;
    pollRef.current = setInterval(async () => {
      const res = await getTicketThreadAction(
        ticketId,
        guestEmail ?? undefined,
      );
      if (res.ok) {
        setThreadMessages(res.messages);
        setThreadStatus(res.status);
      }
    }, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, view, ticketId, guestEmail]);

  if (pathname.startsWith("/admin")) return null;

  async function loadThread(id: string, email?: string) {
    const res = await getTicketThreadAction(id, email);
    if (res.ok) {
      setThreadMessages(res.messages);
      setThreadStatus(res.status);
    }
  }

  function handleStartNewRequest() {
    setTicketId(null);
    setGuestEmail(null);
    setThreadMessages([]);
    setThreadStatus(null);
    setAiHistory([]);
    setAiBlocks([
      {
        type: "text",
        role: "assistant",
        content: "Chào bạn, mình có thể giúp gì?",
      },
    ]);
    localStorage.removeItem(STORAGE_TICKET_KEY);
    localStorage.removeItem(STORAGE_EMAIL_KEY);
    setView("ai");
  }

  async function handleAiSend() {
    setError(null);
    const text = aiDraft.trim();
    if (!text) return;
    if (!loggedIn && !aiEmail.trim()) {
      setError(
        "Vui lòng nhập email trước khi chat để mình liên hệ lại nếu cần.",
      );
      return;
    }
    const nextHistory = [
      ...aiHistory,
      { role: "user" as const, content: text },
    ];
    setAiHistory(nextHistory);
    setAiBlocks((cur) => [
      ...cur,
      { type: "text", role: "user", content: text },
    ]);
    setAiDraft("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/support-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory,
          guestEmail: loggedIn ? undefined : aiEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra.");
        setAiLoading(false);
        return;
      }

      const blocks: ChatBlock[] = data.blocks;
      setAiBlocks((cur) => [...cur, ...blocks]);
      const textBlock = blocks.find((b) => b.type === "text") as
        | { content: string }
        | undefined;
      if (textBlock)
        setAiHistory((cur) => [
          ...cur,
          { role: "assistant", content: textBlock.content },
        ]);

      if (data.ticketId) {
        setTicketId(data.ticketId);
        if (!loggedIn) {
          localStorage.setItem(STORAGE_TICKET_KEY, data.ticketId);
          localStorage.setItem(STORAGE_EMAIL_KEY, aiEmail.trim());
          setGuestEmail(aiEmail.trim());
        }
        await loadThread(data.ticketId, loggedIn ? undefined : aiEmail.trim());
        setView("thread");
      }
    } catch {
      setError("Không kết nối được trợ lý, thử lại sau.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleManualSubmit() {
    setError(null);
    if (!loggedIn && !manualEmail.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!manualContent.trim()) {
      setError("Vui lòng nhập nội dung cần hỗ trợ.");
      return;
    }
    const res = await createSupportTicketAction({
      topic: manualTopic,
      message: manualContent,
      guestEmail: loggedIn ? undefined : manualEmail.trim(),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTicketId(res.ticketId);
    if (!loggedIn) {
      localStorage.setItem(STORAGE_TICKET_KEY, res.ticketId);
      localStorage.setItem(STORAGE_EMAIL_KEY, manualEmail.trim());
      setGuestEmail(manualEmail.trim());
    }
    await loadThread(res.ticketId, loggedIn ? undefined : manualEmail.trim());
    setView("thread");
    setManualContent("");
  }

  async function handleThreadReply() {
    if (!ticketId || !reply.trim()) return;
    const body = reply.trim();
    setReply("");
    setThreadMessages((cur) => [
      ...cur,
      {
        id: `tmp-${Date.now()}`,
        senderRole: "CUSTOMER",
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
    const res = await sendCustomerMessageAction({
      ticketId,
      body,
      guestEmail: guestEmail ?? undefined,
    });
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open ? (
        <section className="flex h-[560px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden border border-border bg-background shadow-2xl shadow-black/40">
          <header className="flex items-center justify-between border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-foreground">
                  NEXUS Support
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {view === "thread" && threadStatus === "RESOLVED"
                    ? "Đã xử lý"
                    : "Chúng tôi có thể giúp gì?"}
                </p>
              </div>
            </div>
            <button
              aria-label="Đóng khung hỗ trợ"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          {!loaded ? (
            <div className="flex flex-1 items-center justify-center text-[11px] text-muted-foreground">
              Đang tải...
            </div>
          ) : view === "thread" && ticketId ? (
            <>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {threadMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] border px-3 py-2 text-[11px] leading-relaxed ${
                      m.senderRole === "CUSTOMER"
                        ? "self-end border-border bg-foreground/[0.06] text-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
                {threadStatus === "RESOLVED" && (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <p className="text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                      Yêu cầu đã được xử lý — nhắn tiếp để mở lại
                    </p>
                    <button
                      type="button"
                      onClick={handleStartNewRequest}
                      className="text-[10px] uppercase tracking-[0.15em] text-foreground underline underline-offset-4"
                    >
                      Bắt đầu yêu cầu mới →
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <input
                  aria-label="Nhắn cho hỗ trợ"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") handleThreadReply();
                  }}
                  placeholder="Nhập tin nhắn..."
                  className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  aria-label="Gửi"
                  onClick={handleThreadReply}
                  className="grid size-9 shrink-0 place-items-center bg-primary text-primary-foreground hover:bg-primary/80"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </>
          ) : view === "manual" ? (
            <form
              className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleManualSubmit();
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-foreground">
                Liên hệ nhân viên
              </p>
              {!loggedIn && (
                <input
                  required
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Email của bạn"
                  className="w-full border border-border bg-background px-3 py-2.5 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              )}
              <select
                value={manualTopic}
                onChange={(e) =>
                  setManualTopic(e.target.value as typeof manualTopic)
                }
                className="w-full border border-border bg-background px-3 py-2.5 text-[11px] uppercase tracking-[0.1em] text-foreground"
              >
                <option value="GENERAL">Hỗ trợ chung</option>
                <option value="ORDER">Đơn hàng</option>
                <option value="PAYMENT">Thanh toán</option>
                <option value="ACCOUNT">Tài khoản</option>
              </select>
              <textarea
                required
                rows={4}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Nội dung cần hỗ trợ..."
                className="w-full resize-none border border-border bg-background px-3 py-2.5 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              {error && <p className="text-[11px] text-destructive">{error}</p>}
              <button
                type="submit"
                className="w-full bg-primary px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] text-primary-foreground"
              >
                Gửi yêu cầu
              </button>
              <button
                type="button"
                onClick={() => setView("ai")}
                className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
              >
                ← Quay lại chat với trợ lý
              </button>
            </form>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {!loggedIn && (
                  <input
                    type="email"
                    value={aiEmail}
                    onChange={(e) => setAiEmail(e.target.value)}
                    placeholder="Email của bạn (để mình liên hệ lại nếu cần)"
                    className="w-full border border-border bg-background px-3 py-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                )}
                {aiBlocks.map((block, i) => {
                  if (block.type === "text") {
                    return (
                      <div
                        key={i}
                        className={`max-w-[85%] border px-3 py-2 text-[11px] leading-relaxed ${
                          block.role === "user"
                            ? "self-end border-border bg-foreground/[0.06] text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {block.content}
                      </div>
                    );
                  }
                  if (block.type === "products") {
                    return (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        {block.products.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            onAdded={(newBlocks) =>
                              setAiBlocks((cur) => [...cur, ...newBlocks])
                            }
                          />
                        ))}
                      </div>
                    );
                  }
                  if (block.type === "cart")
                    return <CartBlockView key={i} cart={block.cart} />;
                  if (block.type === "actions")
                    return <ActionsBlockView key={i} actions={block.actions} />;
                  return null;
                })}
                {aiLoading && (
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                    Đang trả lời...
                  </p>
                )}
                {error && (
                  <p className="text-[11px] text-destructive">{error}</p>
                )}
                <button
                  type="button"
                  onClick={() => setView("manual")}
                  className="border border-border px-3 py-3 text-left text-[10px] uppercase tracking-[0.1em] text-foreground hover:bg-foreground/[0.05]"
                >
                  Liên hệ nhân viên trực tiếp →
                </button>
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <input
                  aria-label="Nhắn cho trợ lý"
                  value={aiDraft}
                  onChange={(e) => setAiDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") handleAiSend();
                  }}
                  placeholder="Tìm sản phẩm, hỏi đơn hàng..."
                  className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  aria-label="Gửi"
                  onClick={handleAiSend}
                  disabled={aiLoading}
                  className="grid size-9 shrink-0 place-items-center bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 border border-border bg-primary px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-primary-foreground shadow-xl shadow-black/20 transition-transform hover:-translate-y-0.5"
          aria-label="Mở khung hỗ trợ"
        >
          <MessageCircle className="size-4" /> Hỗ trợ
        </button>
      )}
    </div>
  );
}

export default SupportChat;
