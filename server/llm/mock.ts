import "server-only";
// Mock LLM adapter — used through M4. No API key required.
// Replaced by provider.ts in M5 when LLM_MODE=real.

import type { LLMAdapter, LLMStageResult } from "./index";
import type { ExtractedIntent } from "@/shared/types/intent";
import type { ProductRecommendation } from "@/shared/types/product";
import { extractIntent } from "@/server/assistant/intent";

export const mockAdapter: LLMAdapter = {
  async extractIntent(text: string): Promise<LLMStageResult<ExtractedIntent>> {
    console.info("[LLM] intent stage completed", { provider: "mock" });
    return {
      value: extractIntent(text),
      provider: "mock",
      fallbackUsed: false,
    };
  },

  async explain(input: {
    intent: ExtractedIntent;
    products: ProductRecommendation[];
  }): Promise<LLMStageResult<{ message: string; followUps: string[] }>> {
    // Template-based explanation — grounded in the passed products.
    const { intent, products } = input;
    const { constraints } = intent;

    if (products.length === 0) {
      console.info("[LLM] explanation stage completed", { provider: "mock" });
      return {
        value: {
          message:
            "I couldn't find products matching all your criteria. Try relaxing one constraint — for example, raising your budget or removing the fragrance-free filter.",
          followUps: ["Increase budget to 800 CZK", "Include products with fragrance", "Show all SPF options"],
        },
        provider: "mock",
        fallbackUsed: false,
      };
    }

    const parts: string[] = [];

    if (constraints.skinTypes && constraints.skinTypes.length > 0) {
      parts.push(`your ${constraints.skinTypes.join(" and ")} skin`);
    }
    if (constraints.maxPriceCzk) {
      parts.push(`a budget under ${constraints.maxPriceCzk} CZK`);
    }
    if (constraints.fragranceFree) {
      parts.push("a preference for fragrance-free products");
    }
    if (constraints.minSpf) {
      parts.push(`SPF ${constraints.minSpf}+ protection`);
    }

    const contextStr =
      parts.length > 0 ? `Based on ${parts.join(", ")}, here` : "Here";
    const countStr =
      products.length === 1
        ? "is the best match"
        : `are ${products.length} products that match your needs`;

    const message = `${contextStr} ${countStr}. All recommendations are grounded in the product catalog — no guesses.`;

    console.info("[LLM] explanation stage completed", { provider: "mock" });
    return {
      value: { message, followUps: [] },
      provider: "mock",
      fallbackUsed: false,
    };
  },
};
