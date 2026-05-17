import "server-only";
// handleChat(req) → ChatResponse
// Orchestrates: intent extraction → search → explain → structured response.
// See docs/ARCHITECTURE.md — Orchestration Flow.

import type {
  ChatRequest,
  ChatResponse,
  LLMDebug,
  ToolDebug,
} from "@/shared/types/chat";
import type { ExtractedIntent } from "@/shared/types/intent";
import { buildGroundedExplanation } from "./explain";
import { searchProducts } from "@/server/tools/searchProducts";
import { getLLMAdapter, getLLMMode } from "@/server/llm/index";

export async function handleChat(req: ChatRequest): Promise<ChatResponse> {
  // 1. Extract intent through the configured LLM boundary.
  const adapter = await getLLMAdapter();
  const intentResult = await adapter.extractIntent(req.message);
  const intent = intentResult.value;

  // 2. Short-circuit non-product queries
  if (intent.goal !== "find_product") {
    const debug = req.debug
      ? {
          intent,
          tool: buildToolDebug(intent, 0, 0),
          llmMode: getLLMMode(),
          llm: buildLLMDebug({
            intentProvider: intentResult.provider,
            explanationProvider: "none",
            shortCircuited: true,
            fallbackUsed: intentResult.fallbackUsed,
            model: intentResult.model,
          }),
        }
      : undefined;

    return {
      assistantMessage:
        "I'm a product recommendation assistant. Try asking: \"I have oily skin and need SPF under 500 CZK.\"",
      recommendations: [],
      followUps: [
        "I have oily sensitive skin, looking for SPF under 500 CZK",
        "Fragrance-free moisturizer for dry skin",
        "Serum for acne-prone skin",
      ],
      debug,
    };
  }

  // 3. Search products (the only source of product facts)
  const { constraints } = intent;
  const searchResult = searchProducts(constraints);

  // 4. Build grounded explanation
  const explanationResult = await buildGroundedExplanation(
    searchResult.matches,
    intent,
  );
  const { message, followUps: llmFollowUps } = explanationResult.value;

  // 5. Generate deterministic follow-up chips from unused constraints
  const followUps = generateFollowUps(constraints, searchResult.matches.length, llmFollowUps);

  // 6. Build debug payload (only when requested)
  const toolDebug = buildToolDebug(
    intent,
    searchResult.matches.length,
    searchResult.rejected.length,
  );

  const debug = req.debug
    ? {
        intent,
        tool: toolDebug,
        llmMode: getLLMMode(),
        llm: buildLLMDebug({
          intentProvider: intentResult.provider,
          explanationProvider: explanationResult.provider,
          shortCircuited: false,
          fallbackUsed: intentResult.fallbackUsed || explanationResult.fallbackUsed,
          model: explanationResult.model ?? intentResult.model,
        }),
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
  constraints: ExtractedIntent["constraints"],
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

function buildToolDebug(
  intent: ExtractedIntent,
  candidateCount: number,
  rejectedCount: number,
): ToolDebug {
  return {
    toolName: "searchProducts",
    inputConstraints: intent.constraints,
    candidateCount,
    rejectedCount,
  };
}

function buildLLMDebug(debug: LLMDebug): LLMDebug {
  return debug.model === undefined
    ? {
        intentProvider: debug.intentProvider,
        explanationProvider: debug.explanationProvider,
        shortCircuited: debug.shortCircuited,
        fallbackUsed: debug.fallbackUsed,
      }
    : debug;
}
