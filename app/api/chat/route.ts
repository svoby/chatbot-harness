export const runtime = "nodejs";
// POST /api/chat — validates ChatRequest, delegates to orchestrator, returns ChatResponse.
// See docs/API_CONTRACTS.md.

import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@/shared/types/chat";
import { handleChat } from "@/server/assistant/orchestrator";

type RequestParseResult =
  | { ok: true; value: ChatRequest }
  | { ok: false; error: string };

function parseChatRequest(body: unknown): RequestParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "message is required and must be a non-empty string" };
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.message !== "string" || payload.message.trim() === "") {
    return { ok: false, error: "message is required and must be a non-empty string" };
  }

  if (payload.debug !== undefined && typeof payload.debug !== "boolean") {
    return { ok: false, error: "debug must be a boolean when provided" };
  }

  return {
    ok: true,
    value: {
      message: payload.message.trim(),
      ...(payload.debug !== undefined ? { debug: payload.debug } : {}),
    },
  };
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ChatResponse | { error: string }>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseChatRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const response = await handleChat(parsed.value);
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/chat] Orchestrator error:", err);
    const fallback: ChatResponse = {
      assistantMessage:
        "An unexpected error occurred. Please try again.",
      recommendations: [],
      followUps: [],
    };
    return NextResponse.json(fallback, { status: 500 });
  }
}
