import "server-only";
// buildGroundedExplanation(products, intent) → { message, followUps }
// Delegates to the LLM adapter (mock in M1–M4, real in M5+).
// INVARIANT: the explanation must only reference products passed as arguments.

import type { ExtractedIntent } from "@/shared/types/intent";
import type { ProductRecommendation } from "@/shared/types/product";
import { getLLMAdapter } from "@/server/llm/index";

export async function buildGroundedExplanation(
  products: ProductRecommendation[],
  intent: ExtractedIntent,
): Promise<{ message: string; followUps: string[] }> {
  const adapter = await getLLMAdapter();
  return adapter.explain({ intent, products });
}
