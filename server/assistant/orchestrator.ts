import "server-only";
// handleChat(req) → ChatResponse
// Orchestrates: intent extraction → search → explain → structured response.
// See docs/ARCHITECTURE.md — Orchestration Flow.

import type { ChatRequest, ChatResponse, ToolDebug } from "@/shared/types/chat";
import { extractIntent } from "./intent";
import { buildGroundedExplanation } from "./explain";
import { searchProducts } from "@/server/tools/searchProducts";
import { getLLMMode } from "@/server/llm/index";

export async function handleChat(req: ChatRequest): Promise<ChatResponse> {
  // 1. Extract intent deterministically (M1–M4) or via LLM (M5+)
  const intent = extractIntent(req.message);

  // 2. Short-circuit non-product queries
  if (intent.goal !== "find_product") {
    return {
      assistantMessage:
        "I'm a product recommendation assistant. Try asking: \"I have oily skin and need SPF under 500 CZK.\"",
      recommendations: [],
      followUps: [
        "I have oily sensitive skin, looking for SPF under 500 CZK",
        "Fragrance-free moisturizer for dry skin",
        "Serum for acne-prone skin",
      ],
    };
  }

  // 3. Search products (the only source of product facts)
  const { constraints } = intent;
  const searchResult = searchProducts(constraints);

  // 4. Build grounded explanation
  const { message, followUps: llmFollowUps } = await buildGroundedExplanation(
    searchResult.matches,
    intent,
  );

  // 5. Generate deterministic follow-up chips from unused constraints
  const followUps = generateFollowUps(constraints, searchResult.matches.length, llmFollowUps);

  // 6. Build debug payload (only when requested)
  const toolDebug: ToolDebug = {
    toolName: "searchProducts",
    inputConstraints: constraints,
    candidateCount: searchResult.matches.length,
    rejectedCount: searchResult.rejected.length,
  };

  const debug = req.debug
    ? {
        intent,
        tool: toolDebug,
        llmMode: getLLMMode(),
      }
    : undefined;

  return {
    assistantMessage: message,
    recommendations: searchResult.matches,
    followUps,
    debug,
  };
}

// ---------------------------------------------------------------------------
// Follow-up chip generation — deterministic, based on unused constraints
// ---------------------------------------------------------------------------

function generateFollowUps(
  constraints: ReturnType<typeof extractIntent>["constraints"],
  matchCount: number,
  llmFollowUps: string[],
): string[] {
  if (llmFollowUps.length > 0) return llmFollowUps.slice(0, 3);

  const chips: string[] = [];

  if (matchCount === 0) {
    // No results — suggest relaxing constraints
    if (constraints.maxPriceCzk && constraints.maxPriceCzk < 600) {
      chips.push(`Increase budget to ${constraints.maxPriceCzk + 200} CZK`);
    }
    if (constraints.fragranceFree) {
      chips.push("Include products with fragrance");
    }
    if (constraints.category) {
      chips.push(`Show all ${constraints.category} products`);
    }
    return chips.slice(0, 3);
  }

  // Texture filter not applied — offer specific texture options
  if (!constraints.textures || constraints.textures.length === 0) {
    chips.push("Show only gel texture");
    chips.push("Show only fluid texture");
  }

  // Price filter not applied — or tighten existing one
  if (!constraints.maxPriceCzk) {
    chips.push("Under 400 CZK");
  } else if (constraints.maxPriceCzk > 400) {
    chips.push(`Under ${Math.round(constraints.maxPriceCzk * 0.7 / 50) * 50} CZK`);
  }

  // Fragrance-free not requested — offer it as a refinement
  if (!constraints.fragranceFree) {
    chips.push("Fragrance-free only");
  }

  // Skin concerns not specified — offer common ones
  if (!constraints.concerns || constraints.concerns.length === 0) {
    chips.push("Also good for acne-prone skin?");
  } else if (!constraints.concerns.includes("aging")) {
    chips.push("Also anti-aging?");
  }

  return chips.slice(0, 3);
}
