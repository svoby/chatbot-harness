import "server-only";
// LLM adapter interface + factory.
// Implementations: mock.ts (M1–M4), provider.ts (M5+).
// Selection controlled by LLM_MODE env var ("mock" | "real").

import type { ExtractedIntent } from "@/shared/types/intent";
import type { ProductRecommendation } from "@/shared/types/product";

export interface LLMAdapter {
  extractIntent(text: string): Promise<ExtractedIntent>;
  explain(input: {
    intent: ExtractedIntent;
    products: ProductRecommendation[];
  }): Promise<{ message: string; followUps: string[] }>;
}

export type LLMMode = "mock" | "real";

export function getLLMMode(): LLMMode {
  return process.env.LLM_MODE === "real" ? "real" : "mock";
}

export async function getLLMAdapter(): Promise<LLMAdapter> {
  const mode = getLLMMode();
  if (mode === "real") {
    const { realAdapter } = await import("./provider");
    return realAdapter;
  }
  const { mockAdapter } = await import("./mock");
  return mockAdapter;
}
