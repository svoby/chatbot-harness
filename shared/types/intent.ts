// Source of truth: docs/API_CONTRACTS.md
// Implemented in M1.

import type { Product, SkinType, SkinConcern } from "./product";

export interface ProductSearchConstraints {
  category?: Product["category"];
  maxPriceCzk?: number;
  minPriceCzk?: number;
  skinTypes?: SkinType[];
  concerns?: SkinConcern[];
  minSpf?: number;
  fragranceFree?: boolean;
  textures?: NonNullable<Product["texture"]>[];
  inStockOnly?: boolean;
}

export interface ExtractedIntent {
  goal: "find_product" | "ask_question" | "smalltalk";
  constraints: ProductSearchConstraints;
  rawUserText: string;
}
