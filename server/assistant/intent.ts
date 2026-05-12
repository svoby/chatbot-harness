import "server-only";
// extractIntent(text) → ExtractedIntent
// M1–M4: deterministic keyword/regex parser.
// M5: will delegate to LLM adapter with structured output + fallback to this function.

import type { ExtractedIntent, ProductSearchConstraints } from "@/shared/types/intent";
import type { Product, SkinType, SkinConcern } from "@/shared/types/product";

const SKIN_TYPE_KEYWORDS: Record<SkinType, string[]> = {
  oily: ["oily", "greasy", "shiny"],
  dry: ["dry", "flaky", "tight"],
  combination: ["combination", "combo"],
  normal: ["normal"],
  sensitive: ["sensitive", "reactive", "easily irritated"],
};

const CONCERN_KEYWORDS: Record<SkinConcern, string[]> = {
  acne: ["acne", "blemish", "pimple", "breakout", "spot"],
  redness: ["redness", "rosacea", "red", "reactive"],
  pigmentation: ["pigmentation", "dark spot", "hyperpigmentation", "uneven tone"],
  aging: ["aging", "ageing", "anti-age", "anti-aging", "wrinkle", "fine line"],
  dehydration: ["dehydration", "dehydrated", "moisture", "hydration"],
};

const CATEGORY_KEYWORDS: Record<Product["category"], string[]> = {
  spf: ["spf", "sunscreen", "sun protection", "sunblock", "uv protection", "uva", "uvb"],
  moisturizer: ["moisturizer", "moisturiser", "moisturizing", "day cream", "face cream"],
  cleanser: ["cleanser", "face wash", "cleansing", "wash"],
  serum: ["serum"],
};

const TEXTURE_KEYWORDS: Record<NonNullable<Product["texture"]>, string[]> = {
  fluid: ["fluid", "light"],
  gel: ["gel"],
  cream: ["cream", "rich"],
  stick: ["stick"],
};

export function extractIntent(text: string): ExtractedIntent {
  const lower = text.toLowerCase();
  const constraints: ProductSearchConstraints = {};

  // Determine goal heuristically
  const isProductSearch =
    CATEGORY_KEYWORDS.spf.some((k) => lower.includes(k)) ||
    CATEGORY_KEYWORDS.moisturizer.some((k) => lower.includes(k)) ||
    CATEGORY_KEYWORDS.cleanser.some((k) => lower.includes(k)) ||
    CATEGORY_KEYWORDS.serum.some((k) => lower.includes(k)) ||
    lower.includes("recommend") ||
    lower.includes("suggest") ||
    lower.includes("looking for") ||
    lower.includes("want") ||
    lower.includes("need");

  const goal: ExtractedIntent["goal"] = isProductSearch
    ? "find_product"
    : "ask_question";

  // Category
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Product["category"], string[]][]) {
    if (keywords.some((k) => lower.includes(k))) {
      constraints.category = cat;
      break;
    }
  }

  // Price — "under X CZK", "below X", "max X CZK", "up to X", "do X Kč", "za X", "X korun"
  const pricePatterns = [
    /under\s+(\d+)\s*(?:czk|kč|kc|korun)?/i,
    /below\s+(\d+)\s*(?:czk|kč|kc|korun)?/i,
    /(?:max(?:imum)?|up\s+to|at\s+most)\s+(\d+)\s*(?:czk|kč|kc|korun)?/i,
    /(\d+)\s*(?:czk|kč|kc|korun)?\s*(?:max|maximum|budget)/i,
    /budget\s+(?:of\s+)?(\d+)/i,
    /(?:do|za)\s+(\d+)\s*(?:kč|czk|kc|korun)/i,
    /(\d+)\s*(?:kč|czk|korun)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = lower.match(pattern);
    if (match) {
      const parsed = parseInt(match[1], 10);
      // Sanity check: prices in CZK are typically 50–5000
      if (parsed >= 50 && parsed <= 5000) {
        constraints.maxPriceCzk = parsed;
        break;
      }
    }
  }

  // SPF number — "spf 30", "spf50", "at least spf 30"
  const spfMatch = lower.match(/spf\s*(\d+)/i);
  if (spfMatch) {
    constraints.minSpf = parseInt(spfMatch[1], 10);
  }

  // Fragrance-free
  if (
    lower.includes("fragrance-free") ||
    lower.includes("fragrance free") ||
    lower.includes("without fragrance") ||
    lower.includes("no fragrance") ||
    lower.includes("unscented") ||
    lower.includes("bez parfémy") ||
    lower.includes("bez vůně")
  ) {
    constraints.fragranceFree = true;
  }

  // In-stock only
  if (lower.includes("in stock") || lower.includes("available")) {
    constraints.inStockOnly = true;
  }

  // Skin types
  const skinTypes: SkinType[] = [];
  for (const [type, keywords] of Object.entries(SKIN_TYPE_KEYWORDS) as [SkinType, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) {
      skinTypes.push(type);
    }
  }
  if (skinTypes.length > 0) constraints.skinTypes = skinTypes;

  // Skin concerns
  const concerns: SkinConcern[] = [];
  for (const [concern, keywords] of Object.entries(CONCERN_KEYWORDS) as [SkinConcern, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) {
      concerns.push(concern);
    }
  }
  if (concerns.length > 0) constraints.concerns = concerns;

  // Textures
  const textures: NonNullable<Product["texture"]>[] = [];
  for (const [tex, keywords] of Object.entries(TEXTURE_KEYWORDS) as [NonNullable<Product["texture"]>, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) {
      textures.push(tex);
    }
  }
  if (textures.length > 0) constraints.textures = textures;

  return { goal, constraints, rawUserText: text };
}
