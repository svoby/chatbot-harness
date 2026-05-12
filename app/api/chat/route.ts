export const runtime = "nodejs";
// POST /api/chat — validates ChatRequest, delegates to orchestrator, returns ChatResponse.
// See docs/API_CONTRACTS.md.

import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@/shared/types/chat";
import { handleChat } from "@/server/assistant/orchestrator";

function isValidRequest(body: unknown): body is ChatRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).message === "string" &&
    (body as Record<string, unknown>).message !== ""
  );
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

  if (!isValidRequest(body)) {
    return NextResponse.json(
      { error: "message is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  try {
    const response = await handleChat(body);
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
