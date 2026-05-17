# Architecture

## Layers

```
┌─────────────────────────────────────────────────┐
│  Client (browser)                               │
│  components/ChatPanel.tsx  ("use client")       │
│  components/MessageList.tsx                     │
│  components/ProductCard.tsx                     │
│  components/FollowUpChips.tsx                   │
│  components/DebugPanel.tsx  ("use client")      │
└──────────────────┬──────────────────────────────┘
                   │  POST /api/chat  (ChatRequest)
                   │  ←  JSON  (ChatResponse)
┌──────────────────▼──────────────────────────────┐
│  Route Handler  (Next.js, Node runtime)         │
│  app/api/chat/route.ts                          │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Orchestrator   (server-only)                   │
│  server/assistant/orchestrator.ts               │
│    ├── server/assistant/intent.ts               │
│    ├── server/tools/searchProducts.ts           │
│    └── server/assistant/explain.ts              │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Adapters & Data  (server-only)                 │
│  server/llm/index.ts     ← interface            │
│  server/llm/mock.ts      ← deterministic mode   │
│  server/llm/provider.ts  ← real provider mode   │
│  server/data/catalog.ts  ← local JSON           │
│  server/data/catalog.json                       │
└─────────────────────────────────────────────────┘
```

## Client/server boundary — hard rules

1. Everything under `server/**` carries `import "server-only"` at the top.
   The Next.js build will fail if a client component accidentally imports it.
2. LLM SDK imports and provider keys exist only in `server/llm/**`.
   `NEXT_PUBLIC_*` is **forbidden** for any LLM/provider configuration.
3. The client communicates with the backend exclusively via `POST /api/chat`.
   It sends `ChatRequest` and receives `ChatResponse` (see [API_CONTRACTS.md](API_CONTRACTS.md)).
4. `shared/types/**` is value-free TypeScript — no runtime imports of server code.
   Safe to import from both client and server.

## Folder layout

```
chatbot/
├── app/
│   ├── layout.tsx           Server Component, app shell
│   ├── page.tsx             Server Component, mounts ChatPanel
│   └── api/chat/route.ts   POST handler (Node runtime)
├── components/              UI components (client or server-compatible)
├── server/
│   ├── assistant/           Orchestrator, intent, explain
│   ├── tools/               searchProducts (the product fact source)
│   ├── data/                catalog.ts + catalog.json
│   └── llm/                 LLMAdapter interface + implementations
├── shared/types/            ChatRequest, ChatResponse, Product, intent types
└── docs/                    Project memory (this folder)
```

## Orchestration flow

1. `route.ts` — validate `ChatRequest`.
2. `orchestrator.handleChat(req)`:
   a. `extractIntent(message)` — deterministic keyword/regex parser.
   b. If `intent.goal` is not `find_product`, return the product-assistant guardrail response.
   c. `searchProducts(constraints)` — filter + rank from catalog; returns `{ matches, rejected }`.
   d. Top-N (N=3) selected by score.
   e. `buildGroundedExplanation(topN, intent)` — LLM adapter selected by `LLM_MODE`.
   f. `followUps` — generated deterministically from unused constraints.
3. Return `ChatResponse`.

## Chat runtime flow

Current end-to-end behavior after `POST /api/chat`:

1. A client or API caller sends a `ChatRequest` JSON body to `app/api/chat/route.ts`.
2. The route validates that `message` is a non-empty string and `debug`, when present, is a boolean. Invalid JSON or shape returns HTTP 400.
3. The route delegates to `handleChat(req)` in `server/assistant/orchestrator.ts`.
4. The orchestrator calls `extractIntent(req.message)` in `server/assistant/intent.ts`. This stage is currently deterministic; it does not call the LLM adapter.
5. If the extracted goal is not `find_product`, the orchestrator short-circuits with the product-assistant guardrail response, empty recommendations, and deterministic example follow-ups. No product search and no LLM explanation call happens on this path.
6. If the goal is `find_product`, the orchestrator calls `searchProducts(constraints)`. This is deterministic catalog filtering and ranking, and it is the only source of product facts.
7. The orchestrator sends the selected product recommendations and extracted intent to `buildGroundedExplanation(...)`, which calls the selected LLM adapter through `getLLMAdapter()`.
8. Follow-up chips come from the adapter when provided; otherwise deterministic fallback chips are generated from unused constraints and match count.
9. The product-search response returns `assistantMessage`, `recommendations`, `followUps`, and, when requested, `debug`. The guardrail short-circuit currently returns no `debug` object.

LLM usage by stage:

| Stage | Calls an LLM today? | Notes |
|---|---:|---|
| Route validation | No | Hand-written route guard. |
| Intent extraction | No | `server/assistant/intent.ts` is deterministic on the current baseline. |
| Guardrail for non-product goals | No | Short-circuits before search or explanation. |
| Product search and ranking | No | Catalog-backed `searchProducts`; the LLM never supplies product facts. |
| Explanation for product matches | Yes, depending on mode | Uses mock template in `mock` mode or OpenAI in `real` mode. |
| Follow-up fallback generation | No | Deterministic unless the explanation adapter returned follow-ups. |
| Debug payload | No | On the product-search path only, reports intent, tool counts, and `llmMode` when requested. |

### LLM mode

`LLM_MODE` controls which explanation adapter `getLLMAdapter()` returns:

- Missing `LLM_MODE` or any value other than `real` means `mock`. Mock mode requires no provider key and returns deterministic template explanations.
- `LLM_MODE=real` requires `OPENAI_API_KEY` server-side. In real mode, the explanation stage calls the OpenAI provider adapter with the selected product data. If provider JSON output is invalid, the provider adapter falls back to the mock explanation template.

The provider adapter also contains an LLM intent-extraction implementation, but the current orchestrator does not call it. Do not treat intent extraction as provider-backed until that code path is wired in a later issue.

### Guardrail behavior

Meta questions such as `Are you an LLM?`, `Who made you?`, or `Can you explain transformers?` do not contain the current product-search triggers such as a category, `recommend`, `suggest`, `looking for`, `want`, or `need`. The deterministic intent parser classifies them as `ask_question`, so the orchestrator returns:

```text
I'm a product recommendation assistant. Try asking: "I have oily skin and need SPF under 500 CZK."
```

That response is intentional. It keeps the prototype focused on product recommendations and avoids using the LLM as a general chat or identity source.

Example recommendation requests:

- `I have oily sensitive skin and need SPF under 500 CZK`
- `Recommend a fragrance-free moisturizer for dry skin`
- `Looking for a serum for acne-prone skin under 400 CZK`
- `Show me an in stock gel cleanser for oily skin`

Example guardrail requests:

- `Are you an LLM?`
- `Who made you?`
- `Tell me a joke`
- `Can you explain transformers?`

Known limitation: on product-search responses, debug mode currently reports the extracted intent, `searchProducts` counts, and `llmMode`, but it does not provide full provider-stage observability such as whether a specific adapter stage used the provider or fell back. Guardrail responses do not currently include a debug object. Broader observability is deferred to issue #26.

## Adapter strategy

Two adapters exist. Everything else is inlined.

- **`LLMAdapter`** (real boundary) — interface in `server/llm/index.ts`.
  Implementations: `mock.ts` (default), `provider.ts` (real mode).
  Orchestrator imports the interface; implementation selected by `LLM_MODE` env var.

- **`searchProducts`** (soft boundary) — single function, typed signature.
  Internally reads `catalog.ts`. A future database milestone swaps its body for
  DB-backed product retrieval; signature unchanged.

Adapters are **not** added for: ranking strategy, prompt templates, telemetry, DI.
Rule: introduce an adapter only when there are 2 real implementations or 1 real + 1 test double.
See [DECISIONS.md](DECISIONS.md).

## LLM system prompts

**Intent extraction** (`gpt-4o-mini`, `temperature: 0`, JSON mode):
- Exists in `server/llm/provider.ts`, but is not called by the current orchestrator.
- The active request path uses `server/assistant/intent.ts` deterministic parsing.
- When a later issue wires provider-backed intent extraction into the request path, this section should be updated against that merged behavior.

**Explanation** (`gpt-4o-mini`, `temperature: 0.3`, JSON mode):
- System prompt includes: *"Only describe products and fields present in the JSON provided. Do not invent facts."*
- Input: user message + selected product data (name, brand, price, SPF, texture, skinTypes, score).
- Returns `{ message: string; followUps: string[] }`.
- On parse failure: falls back to mock adapter template string.

Both prompts use `response_format: { type: "json_object" }` to guarantee parseable output.

## SSR vs CSR

| Component | Type | Reason |
|---|---|---|
| `app/page.tsx` | Server Component | Static shell; no interaction needed |
| `components/ChatPanel.tsx` | Client Component (`"use client"`) | Input state, fetch, event handlers |
| `components/DebugPanel.tsx` | Client Component | Toggle state |
| `app/api/chat/route.ts` | Route Handler (Node) | Server-side LLM/data access |
| `server/**` | Server-only modules | Never serialized to client |
