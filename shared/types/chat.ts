// Source of truth: docs/API_CONTRACTS.md
// Implemented in M1.

import type { ProductRecommendation } from "./product";
import type { ExtractedIntent, ProductSearchConstraints } from "./intent";

export interface ChatRequest {
  message: string;
  debug?: boolean;
}

export interface ToolDebug {
  toolName: "searchProducts";
  inputConstraints: ProductSearchConstraints;
  candidateCount: number;
  rejectedCount: number;
}

export interface ChatResponse {
  assistantMessage: string;
  recommendations: ProductRecommendation[];
  followUps: string[];
  debug?: {
    intent: ExtractedIntent;
    tool: ToolDebug;
    llmMode: "mock" | "real";
  };
}
