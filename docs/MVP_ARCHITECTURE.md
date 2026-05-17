# MVP Architecture And Data Plan

This document defines the production-shaped MVP architecture direction for the
AI Product Assistant. It is a reference document only: the runnable
implementation sequence lives in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## MVP Definition

The MVP is a deployed, database-backed product assistant that keeps the existing
grounding invariant:

> The LLM explains retrieved product facts; it does not invent or select product
> facts.

MVP capabilities:

- Browser-visible Next.js app deployed from this GitHub repository.
- `POST /api/chat` remains the only browser/backend contract.
- Server-side model/provider boundary remains under `server/llm/**`.
- Product recommendations come from deterministic retrieval before any model
  explanation.
- Managed Postgres stores product data once the local catalog is outgrown.
- Debug output remains available enough to inspect intent, retrieval inputs,
  candidate counts, selected records, and model mode.
- Mock/no-key mode remains available for local development and CI.

## Not MVP

Explicitly out of MVP unless a later issue approves it:

- Auth, accounts, or sessions unless a demo environment requires minimal access
  control.
- Cart, checkout, payments, order management, or commerce platform behavior.
- Multi-tenant platform architecture.
- Complex agent framework or multi-agent orchestration.
- Enterprise ingestion pipeline.
- Docker, unless the selected deployment target requires it.
- Model benchmark matrix or extended provider shootout.
- Generic document/FAQ RAG before product retrieval is stable.
- Embeddings, vector search, or vector database for the first database-backed
  product retrieval phase.

## Deployment Shape

Use GitHub as the source of truth. If deploying on Vercel, connect Vercel to
this repository so branches and PRs receive preview deployments and `master`
deploys to production.

Recommended production services:

| Concern | MVP choice | Notes |
|---|---|---|
| Web app | Vercel-hosted Next.js | Matches current app shape and avoids a separate backend service. |
| Model API | Cloud provider API | Server-side only; model ID configured by env var. |
| Database | Managed Postgres | Prefer a Vercel Marketplace path such as Neon or Supabase when using Vercel. |
| Local/CI data | Existing JSON catalog/mock mode | Keeps no-key development and CI deterministic. |
| Observability | Existing debug response first | Add durable logs/telemetry only when there is real traffic or debugging need. |

Provider keys and database URLs must be server-side environment variables. Do
not expose model or database credentials through `NEXT_PUBLIC_*`.

## Database Shape

Start with managed Postgres. Avoid self-hosted database operations, Dockerized
database parity work, and production-like ops locally beyond basic migrations
and seeding.

Recommended MVP schema direction:

- `products`: canonical SKU/product fields currently represented by `Product`.
- `product_attributes`: normalized rows for high-value filterable attributes
  when JSON metadata becomes awkward.
- JSON metadata on `products`: acceptable for low-volume or experimental
  attributes while the catalog is still small.
- `sources` / `source_documents`: add only when non-product facts enter the
  assistant.
- `orders`: defer unless a demo explicitly needs customer/order context.
- `retrieval_chunks` / embeddings: defer until document/FAQ RAG is introduced.

The first database implementation should seed from `server/data/catalog.json`
and preserve the current `Product`/`ChatResponse` UI contract.

## Retrieval And RAG Plan

Retrieval order is intentionally conservative:

1. Keep deterministic local product search as the current source of truth.
2. Add managed Postgres and seed it from the current catalog.
3. Replace local JSON reads with DB-backed product retrieval without changing
   the browser contract.
4. Tune structured filters/ranking over product fields.
5. Add document/FAQ RAG only after product DB retrieval is stable.
6. Add orders/customer context only after product retrieval and source
   boundaries are reliable.

When RAG arrives, separate fact classes clearly:

- Product facts come from product records.
- Non-product facts come from source documents or source chunks.
- Order/customer facts come from order/customer records.

The model may reference retrieved records internally and in debug output, but it
must not invent product, order, source, price, availability, or attribute facts.

## Model Policy

Use cloud model APIs first for MVP speed, quality, and operational simplicity.
Do not spend MVP time optimizing local models.

Model guardrails:

- Keep `LLM_MODE=mock` working for no-key local development and CI.
- Keep provider calls server-side only.
- Keep the model ID configurable through server-side environment variables.
- Default to a strong mini/standard model for latency and cost.
- Allow a higher-quality model for harder reasoning through configuration, not
  code changes.
- Preserve deterministic fallbacks when model parsing or explanation fails.

## Risks And Guardrails

- Avoid endless infrastructure stabilization: prefer managed services and one
  deploy target.
- Do not add Docker solely for local/CI parity.
- Do not add RAG before structured product DB search works.
- Do not spend MVP cycles on a model benchmark matrix.
- Preserve mock/local mode and CI reliability at every phase.
- Keep the API contract stable unless a later issue explicitly changes it.
- Record non-trivial architecture choices in `docs/DECISIONS.md`.
