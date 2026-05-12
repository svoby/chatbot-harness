# API Contracts

Source of truth for all shared types. Canonical definitions live in `shared/types/`.
**Update this doc whenever you change a type.**

## Endpoint

`POST /api/chat`
Request body: `ChatRequest`
Response body: `ChatResponse`
Runtime: Node.js (not Edge)

---

## ChatRequest

```typescript
interface ChatRequest {
  message: string;    // raw user text
  debug?: boolean;    // if true, response includes debug field
}
```

---

## ChatResponse

```typescript
interface ChatResponse {
  assistantMessage: string;              // prose explanation (grounded)
  recommendations: ProductRecommendation[];  // 0–3 items
  followUps: string[];                   // suggested follow-up chips
  debug?: {
    intent: ExtractedIntent;
    tool: ToolDebug;
    llmMode: "mock" | "real";
  };
}
```

`recommendations` is always present (may be empty array). Never omitted.

---

## Product

```typescript
type SkinType    = "oily" | "dry" | "combination" | "normal" | "sensitive";
type SkinConcern = "acne" | "redness" | "pigmentation" | "aging" | "dehydration";

interface Product {
  id:           string;
  name:         string;
  brand:        string;
  category:     "spf" | "moisturizer" | "cleanser" | "serum";
  priceCzk:     number;
  skinTypes:    SkinType[];
  concerns:     SkinConcern[];
  spf?:         number;
  fragranceFree: boolean;
  texture?:     "fluid" | "cream" | "gel" | "stick";
  inStock:      boolean;
  description:  string;
}
```

---

## ProductRecommendation

```typescript
interface ProductRecommendation {
  product: Product;
  reasons: string[];   // INVARIANT: each reason derived from Product fields only
  score:   number;     // 0..1 from ranker in searchProducts
}
```

---

## ExtractedIntent

```typescript
interface ProductSearchConstraints {
  category?:    Product["category"];
  maxPriceCzk?: number;
  minPriceCzk?: number;
  skinTypes?:   SkinType[];
  concerns?:    SkinConcern[];
  minSpf?:      number;
  fragranceFree?: boolean;
  textures?:    NonNullable<Product["texture"]>[];
  inStockOnly?: boolean;
}

interface ExtractedIntent {
  goal:        "find_product" | "ask_question" | "smalltalk";
  constraints: ProductSearchConstraints;
  rawUserText: string;
}
```

---

## ToolDebug

```typescript
interface ToolDebug {
  toolName:         "searchProducts";
  inputConstraints: ProductSearchConstraints;
  candidateCount:   number;   // products that matched constraints
  rejectedCount:    number;   // products that did not match
}
```

---

## Validation

Input validated at the route boundary with a lightweight hand-written guard.
`zod` not used unless a second validation use-case emerges (see [DECISIONS.md](DECISIONS.md)).
