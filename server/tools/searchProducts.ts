import "server-only";

import type { Product, ProductRecommendation } from "@/shared/types/product";
import type { ProductSearchConstraints } from "@/shared/types/intent";
import { catalog } from "@/server/data/catalog";

export interface SearchResult {
  matches: ProductRecommendation[];
  rejected: Array<{ product: Product; reasons: string[] }>;
}

/**
 * THE ONLY SOURCE OF PRODUCT FACTS.
 * Filters the catalog by constraints, scores matches, returns top N sorted by score.
 * The LLM never calls this directly — the orchestrator does.
 */
export function searchProducts(
  constraints: ProductSearchConstraints,
  topN = 3,
): SearchResult {
  const matches: ProductRecommendation[] = [];
  const rejected: Array<{ product: Product; reasons: string[] }> = [];

  for (const product of catalog) {
    const { pass, failReasons, passReasons } = evaluate(product, constraints);
    if (pass) {
      matches.push({
        product,
        reasons: passReasons,
        score: score(product, constraints),
      });
    } else {
      rejected.push({ product, reasons: failReasons });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return {
    matches: matches.slice(0, topN),
    rejected,
  };
}

// ---------------------------------------------------------------------------
// Evaluation — hard filters (pass/fail) + reason generation
// ---------------------------------------------------------------------------

interface EvalResult {
  pass: boolean;
  failReasons: string[];
  passReasons: string[];
}

function evaluate(
  product: Product,
  c: ProductSearchConstraints,
): EvalResult {
  const failReasons: string[] = [];
  const passReasons: string[] = [];

  // Category
  if (c.category && product.category !== c.category) {
    failReasons.push(`Category is ${product.category}, not ${c.category}`);
  }

  // Price
  if (c.maxPriceCzk !== undefined && product.priceCzk > c.maxPriceCzk) {
    failReasons.push(
      `Price ${product.priceCzk} CZK exceeds budget of ${c.maxPriceCzk} CZK`,
    );
  }
  if (c.minPriceCzk !== undefined && product.priceCzk < c.minPriceCzk) {
    failReasons.push(
      `Price ${product.priceCzk} CZK is below minimum ${c.minPriceCzk} CZK`,
    );
  }

  // SPF
  if (c.minSpf !== undefined) {
    if (product.spf === undefined) {
      failReasons.push("No SPF value listed");
    } else if (product.spf < c.minSpf) {
      failReasons.push(`SPF ${product.spf} is below minimum SPF ${c.minSpf}`);
    }
  }

  // Fragrance-free
  if (c.fragranceFree === true && !product.fragranceFree) {
    failReasons.push("Contains fragrance");
  }

  // In stock
  if (c.inStockOnly === true && !product.inStock) {
    failReasons.push("Out of stock");
  }

  // Textures (soft filter — products without texture field pass)
  if (
    c.textures &&
    c.textures.length > 0 &&
    product.texture !== undefined &&
    !c.textures.includes(product.texture)
  ) {
    failReasons.push(
      `Texture is ${product.texture}, not one of: ${c.textures.join(", ")}`,
    );
  }

  const pass = failReasons.length === 0;

  if (pass) {
    // Build positive reason bullets only from actual product fields
    if (c.maxPriceCzk !== undefined) {
      passReasons.push(`${product.priceCzk} CZK — within your ${c.maxPriceCzk} CZK budget`);
    } else {
      passReasons.push(`${product.priceCzk} CZK`);
    }

    if (c.fragranceFree === true && product.fragranceFree) {
      passReasons.push("Fragrance-free — matches your preference");
    }

    if (c.minSpf !== undefined && product.spf) {
      passReasons.push(`SPF ${product.spf} — meets your SPF requirement`);
    } else if (product.spf) {
      passReasons.push(`SPF ${product.spf}`);
    }

    if (c.skinTypes && c.skinTypes.length > 0) {
      const matchedSkinTypes = c.skinTypes.filter((st) =>
        product.skinTypes.includes(st),
      );
      if (matchedSkinTypes.length > 0) {
        passReasons.push(
          `Formulated for ${matchedSkinTypes.join(" and ")} skin`,
        );
      }
    }

    if (product.texture) {
      passReasons.push(`${product.texture.charAt(0).toUpperCase() + product.texture.slice(1)} texture`);
    }
  }

  return { pass, failReasons, passReasons };
}

// ---------------------------------------------------------------------------
// Scoring — weighted 0..1
// ---------------------------------------------------------------------------

function score(product: Product, c: ProductSearchConstraints): number {
  let s = 0.5; // baseline

  // Budget proximity bonus (closer to budget ceiling = slightly higher)
  if (c.maxPriceCzk !== undefined) {
    const ratio = product.priceCzk / c.maxPriceCzk;
    // prefer products that use 60–90% of budget over very cheap or right at limit
    s += (1 - Math.abs(ratio - 0.75)) * 0.15;
  }

  // Fragrance-free bonus
  if (c.fragranceFree === true && product.fragranceFree) s += 0.15;

  // Skin type match bonus
  if (c.skinTypes && c.skinTypes.length > 0) {
    const matchCount = c.skinTypes.filter((st) =>
      product.skinTypes.includes(st),
    ).length;
    s += (matchCount / c.skinTypes.length) * 0.1;
  }

  // SPF exact/over match
  if (c.minSpf !== undefined && product.spf !== undefined) {
    s += Math.min((product.spf - c.minSpf) / 100 + 0.1, 0.1);
  }

  // Concerns overlap bonus
  if (c.concerns && c.concerns.length > 0 && product.concerns.length > 0) {
    const matchCount = c.concerns.filter((concern) =>
      product.concerns.includes(concern),
    ).length;
    s += (matchCount / c.concerns.length) * 0.1;
  }

  return Math.min(Math.max(s, 0), 1);
}
