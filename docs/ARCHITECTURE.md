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
   a. `extractIntent(message)` — LLM adapter with deterministic fallback.
   b. `searchProducts(constraints)` — filter + rank from catalog; returns `{ matches, rejected }`.
   c. Top-N (N=3) selected by score.
   d. `buildGroundedExplanation(topN, intent)` — LLM adapter with deterministic fallback.
   e. `followUps` — generated deterministically from unused constraints.
3. Return `ChatResponse`.

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
- Instructs the model to extract `ProductSearchConstraints` as structured JSON.
- Returns `goal` + `constraints` matching the `ExtractedIntent` type.
- On parse failure: falls back to `server/assistant/intent.ts` deterministic parser.

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
