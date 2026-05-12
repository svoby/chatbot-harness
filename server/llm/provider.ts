import "server-only";
// Real LLM provider adapter — OpenAI.
// Active when LLM_MODE=real and OPENAI_API_KEY is set.
// Falls back gracefully to deterministic paths if JSON output is malformed.
// See docs/ARCHITECTURE.md — Adapter Strategy.
// See docs/DECISIONS.md — 2026-05-12 LLM provider choice.

import OpenAI from "openai";
import type { LLMAdapter } from "./index";
import type { ExtractedIntent, ProductSearchConstraints } from "@/shared/types/intent";
import type { ProductRecommendation } from "@/shared/types/product";
import { extractIntent } from "@/server/assistant/intent";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Set LLM_MODE=mock or provide the key.");
  }
  return new OpenAI({ apiKey });
}

// ---------------------------------------------------------------------------
// Intent extraction via LLM — JSON mode with deterministic fallback
// ---------------------------------------------------------------------------

const INTENT_SYSTEM_PROMPT = `You are an intent extraction assistant for a skincare product recommendation app.

Extract the user's product search constraints from their message and return ONLY valid JSON in this exact shape:
{
  "goal": "find_product" | "ask_question" | "smalltalk",
  "constraints": {
    "category": "spf" | "moisturizer" | "cleanser" | "serum" | null,
    "maxPriceCzk": number | null,
    "minPriceCzk": number | null,
    "skinTypes": ("oily" | "dry" | "combination" | "normal" | "sensitive")[],
    "concerns": ("acne" | "redness" | "pigmentation" | "aging" | "dehydration")[],
    "minSpf": number | null,
    "fragranceFree": boolean | null,
    "textures": ("fluid" | "cream" | "gel" | "stick")[],
    "inStockOnly": boolean | null
  }
}

Rules:
- Use null for fields not mentioned.
- Use empty arrays [] for skin types / concerns / textures not mentioned.
- Prices are in CZK. If user says "500 Kč" or "500 korun", set maxPriceCzk: 500.
- Only extract what the user explicitly states or clearly implies.`;

async function extractIntentViaLLM(text: string): Promise<ExtractedIntent> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: INTENT_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0,
    max_tokens: 500,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed: unknown = JSON.parse(raw);

  if (!isValidIntentPayload(parsed)) {
    throw new Error("LLM intent response failed schema validation");
  }

  const constraints: ProductSearchConstraints = {
    ...(parsed.constraints.category && { category: parsed.constraints.category as ProductSearchConstraints["category"] }),
    ...(parsed.constraints.maxPriceCzk !== null && { maxPriceCzk: parsed.constraints.maxPriceCzk }),
    ...(parsed.constraints.minPriceCzk !== null && { minPriceCzk: parsed.constraints.minPriceCzk }),
    ...(parsed.constraints.skinTypes.length > 0 && { skinTypes: parsed.constraints.skinTypes as ProductSearchConstraints["skinTypes"] }),
    ...(parsed.constraints.concerns.length > 0 && { concerns: parsed.constraints.concerns as ProductSearchConstraints["concerns"] }),
    ...(parsed.constraints.minSpf !== null && { minSpf: parsed.constraints.minSpf }),
    ...(parsed.constraints.fragranceFree !== null && { fragranceFree: parsed.constraints.fragranceFree }),
    ...(parsed.constraints.textures.length > 0 && { textures: parsed.constraints.textures as ProductSearchConstraints["textures"] }),
    ...(parsed.constraints.inStockOnly !== null && { inStockOnly: parsed.constraints.inStockOnly }),
  };

  return {
    goal: parsed.goal,
    constraints,
    rawUserText: text,
  };
}

// ---------------------------------------------------------------------------
// Explanation via LLM — grounded, strict system prompt
// ---------------------------------------------------------------------------

const EXPLAIN_SYSTEM_PROMPT = `You are a helpful skincare product assistant.

Your ONLY job is to write a short (1–2 sentence) explanation of why the provided products
match the user's request.

STRICT RULES:
1. Only describe products and fields present in the JSON provided. Do not invent facts.
2. Do not mention product names that are not in the products array.
3. Do not invent prices, SPF values, ingredients, or attributes.
4. Return ONLY valid JSON in this shape:
{
  "message": "string (1-2 sentences)",
  "followUps": ["string", "string", "string"]
}
5. followUps should be 2–3 short follow-up questions or filter suggestions the user might want.`;

async function explainViaLLM(input: {
  intent: ExtractedIntent;
  products: ProductRecommendation[];
}): Promise<{ message: string; followUps: string[] }> {
  const client = getClient();

  const productsJson = JSON.stringify(
    input.products.map((r) => ({
      name: r.product.name,
      brand: r.product.brand,
      priceCzk: r.product.priceCzk,
      spf: r.product.spf,
      fragranceFree: r.product.fragranceFree,
      texture: r.product.texture,
      skinTypes: r.product.skinTypes,
      score: r.score,
    })),
    null,
    2,
  );

  const userContext = `User request: "${input.intent.rawUserText}"
Matched products:
${productsJson}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
      { role: "user", content: userContext },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed: unknown = JSON.parse(raw);

  if (!isValidExplanationPayload(parsed)) {
    throw new Error("LLM explanation response failed schema validation");
  }

  return {
    message: parsed.message,
    followUps: parsed.followUps.slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Schema validators (no zod — lightweight guards per DECISIONS.md)
// ---------------------------------------------------------------------------

const VALID_GOALS = ["find_product", "ask_question", "smalltalk"] as const;
const VALID_CATEGORIES = ["spf", "moisturizer", "cleanser", "serum"] as const;
const VALID_SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"] as const;
const VALID_CONCERNS = ["acne", "redness", "pigmentation", "aging", "dehydration"] as const;
const VALID_TEXTURES = ["fluid", "cream", "gel", "stick"] as const;

function isValidIntentPayload(v: unknown): v is {
  goal: "find_product" | "ask_question" | "smalltalk";
  constraints: {
    category: string | null;
    maxPriceCzk: number | null;
    minPriceCzk: number | null;
    skinTypes: string[];
    concerns: string[];
    minSpf: number | null;
    fragranceFree: boolean | null;
    textures: string[];
    inStockOnly: boolean | null;
  };
} {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  if (!VALID_GOALS.includes(obj.goal as never)) return false;
  const c = obj.constraints;
  if (typeof c !== "object" || c === null) return false;
  const constraints = c as Record<string, unknown>;
  if (!Array.isArray(constraints.skinTypes)) return false;
  if (!Array.isArray(constraints.concerns)) return false;
  if (!Array.isArray(constraints.textures)) return false;
  if (
    constraints.category !== null &&
    !VALID_CATEGORIES.includes(constraints.category as never)
  )
    return false;
  const invalidSkinTypes = (constraints.skinTypes as unknown[]).filter(
    (s) => !VALID_SKIN_TYPES.includes(s as never),
  );
  if (invalidSkinTypes.length > 0) return false;
  const invalidConcerns = (constraints.concerns as unknown[]).filter(
    (s) => !VALID_CONCERNS.includes(s as never),
  );
  if (invalidConcerns.length > 0) return false;
  const invalidTextures = (constraints.textures as unknown[]).filter(
    (s) => !VALID_TEXTURES.includes(s as never),
  );
  if (invalidTextures.length > 0) return false;
  return true;
}

function isValidExplanationPayload(
  v: unknown,
): v is { message: string; followUps: string[] } {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.message === "string" &&
    obj.message.length > 0 &&
    Array.isArray(obj.followUps) &&
    (obj.followUps as unknown[]).every((s) => typeof s === "string")
  );
}

// ---------------------------------------------------------------------------
// Exported adapter
// ---------------------------------------------------------------------------

export const realAdapter: LLMAdapter = {
  async extractIntent(text: string): Promise<ExtractedIntent> {
    try {
      return await extractIntentViaLLM(text);
    } catch (err) {
      console.warn("[LLM] extractIntent failed, falling back to deterministic:", err);
      return extractIntent(text);
    }
  },

  async explain(input: {
    intent: ExtractedIntent;
    products: ProductRecommendation[];
  }): Promise<{ message: string; followUps: string[] }> {
    try {
      return await explainViaLLM(input);
    } catch (err) {
      console.warn("[LLM] explain failed, falling back to template:", err);
      // Fall back to the mock adapter's template
      const { mockAdapter } = await import("./mock");
      return mockAdapter.explain(input);
    }
  },
};
