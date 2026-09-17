import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  runSupportAssistant,
  type ChatMessage,
} from "@/lib/ai/support-assistant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const messages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
    : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "Thiếu nội dung." }, { status: 400 });
  }

  const session = await auth();
  const identity = session?.user?.id
    ? { userId: session.user.id }
    : {
        guestEmail:
          typeof body.guestEmail === "string" ? body.guestEmail : undefined,
      };

  try {
    const result = await runSupportAssistant(messages, identity);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Support AI error:", error);
    return NextResponse.json(
      { error: "Trợ lý đang gặp sự cố, vui lòng thử lại." },
      { status: 500 },
    );
  }
}
