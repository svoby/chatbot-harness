// Source of truth: docs/API_CONTRACTS.md
// Implemented in M1.

export type SkinType = "oily" | "dry" | "combination" | "normal" | "sensitive";
export type SkinConcern = "acne" | "redness" | "pigmentation" | "aging" | "dehydration";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "spf" | "moisturizer" | "cleanser" | "serum";
  priceCzk: number;
  skinTypes: SkinType[];
  concerns: SkinConcern[];
  spf?: number;
  fragranceFree: boolean;
  texture?: "fluid" | "cream" | "gel" | "stick";
  inStock: boolean;
  description: string;
}

export interface ProductRecommendation {
  product: Product;
  /** Each reason MUST be derivable from Product fields — never LLM-invented. */
  reasons: string[];
  /** 0..1 score from the ranker in server/tools/searchProducts.ts */
  score: number;
}
