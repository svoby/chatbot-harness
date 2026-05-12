import "server-only";
// Mock LLM adapter — used through M4. No API key required.
// Replaced by provider.ts in M5 when LLM_MODE=real.

import type { LLMAdapter } from "./index";
import type { ExtractedIntent } from "@/shared/types/intent";
import type { ProductRecommendation } from "@/shared/types/product";

export const mockAdapter: LLMAdapter = {
  async extractIntent(text: string): Promise<ExtractedIntent> {
    // The real intent extraction is done deterministically in server/assistant/intent.ts.
    // This mock is a no-op pass-through; the orchestrator calls intent.ts directly in M1–M4.
    return {
      goal: "find_product",
      constraints: {},
      rawUserText: text,
    };
  },

  async explain(input: {
    intent: ExtractedIntent;
    products: ProductRecommendation[];
  }): Promise<{ message: string; followUps: string[] }> {
    // Template-based explanation — grounded in the passed products.
    const { intent, products } = input;
    const { constraints } = intent;

    if (products.length === 0) {
      return {
        message:
          "I couldn't find products matching all your criteria. Try relaxing one constraint — for example, raising your budget or removing the fragrance-free filter.",
        followUps: ["Increase budget to 800 CZK", "Include products with fragrance", "Show all SPF options"],
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

    return { message, followUps: [] };
  },
};
