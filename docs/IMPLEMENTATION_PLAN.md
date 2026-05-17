# MVP Implementation Plan

This is an issue-writing plan, not implementation approval. Create follow-up
issues from these contracts one at a time, keeping each issue scoped to one
runnable milestone.

## Current Baseline

- The current app has a local Next.js harness, deterministic product retrieval,
  grounded explanations, real/mock LLM adapter, and debug panel.
- `POST /api/chat` is the browser/backend contract.
- Product facts come from deterministic retrieval before the LLM explains them.
- `LLM_MODE=mock` and no-key local/CI behavior must keep working.
- MVP architecture direction is Vercel-shaped deployment, cloud model API,
  managed Postgres, then optional non-product RAG.

## Next Milestone

The next implementable milestone is M7: deployable web app. It should connect
the existing app to a deployment target and configure server-side environment
variables without adding database, RAG, auth, queues, Docker, or product-code
architecture changes.

## Dependency Order

1. Provider boundary guardrail: keep SDK imports and provider keys under
   `server/llm/**`; do not introduce `NEXT_PUBLIC_*` provider settings.
2. Deploy: connect the GitHub repo to Vercel or the approved deploy target.
3. Environment configuration: add server-side provider env vars and smoke-test
   mock/no-key mode plus real mode when credentials are available.
4. Database selection/foundation: choose managed Postgres and add only the
   minimal schema/migration/connection foundation approved by that issue.
5. Seed data: seed the current catalog into the database while preserving the
   local JSON catalog for mock/local/CI fallback until explicitly removed.
6. DB-backed retrieval: switch product retrieval behind `searchProducts`
   without changing `POST /api/chat`, `ChatResponse`, or UI contracts.
7. Optional RAG: add source documents or embeddings only after DB-backed
   product retrieval is stable and only for non-product facts.

Deploy/env work may happen before database work. Database selection must happen
before seed data. Seed data must happen before DB-backed retrieval. RAG must
wait for stable DB-backed product retrieval.

## Parallelization Rules

- Safe in parallel after M7 is created: deployment docs/smoke checklist and
  provider-boundary audit, if they touch only docs/config and server env docs.
- Sequential: deploy target selection before env smoke checks; database choice
  before schema/migrations; schema before seed; seed before DB-backed retrieval;
  DB-backed retrieval before RAG.
- Do not run database and retrieval implementation issues in parallel unless
  they use separate worktrees and non-overlapping files.

## Implementation Issue Sequence

### 1. Deployable Web App

Allowed changes: deployment configuration/docs required by the selected target,
production URL documentation after deployment, and server-side env documentation.

Forbidden changes: product retrieval, database code, RAG, auth, package
workarounds, lockfile churn not required by the deploy target, and any
`NEXT_PUBLIC_*` provider/database secrets.

Verification: `npm run lint`, `npm run build`, production or preview smoke
check, mock/no-key local mode check, and confirmation CI still uses `npm ci`.

### 2. Provider Environment Hardening

Allowed changes: server-side env handling around existing `server/llm/**`,
`.env.local.example`, documentation, and fallback behavior if needed.

Forbidden changes: moving SDK calls outside `server/llm/**`, exposing provider
config to the client, changing product selection authority, or requiring an API
key for CI/local mock mode.

Verification: `npm run lint`, `npm run build`, mock mode with no
`OPENAI_API_KEY`, real mode smoke check when credentials are available, and
server/client boundary review.

### 3. Managed Postgres Foundation

Allowed changes: selected managed Postgres client/setup, schema or migrations
for product records, server-only connection code, docs, and decision updates.

Forbidden changes: retrieval behavior swap, RAG/vector tables, orders/customer
tables, self-hosted database ops, Docker, auth, and CI install workarounds.

Verification: `npm run lint`, `npm run build`, migration/schema validation
command if introduced, no-key mock mode, and `npm ci`-compatible lockfile
changes generated from Linux/WSL.

### 4. Catalog Seed Data

Allowed changes: seed script or migration seed that loads
`server/data/catalog.json` into managed Postgres and docs for running it.

Forbidden changes: changing `Product` or `ChatResponse` contracts unless the
issue explicitly updates `API_CONTRACTS.md`, changing ranking behavior, adding
RAG, or removing local JSON/mock fallback.

Verification: seed command against the chosen database, row/count spot check
against the JSON catalog, `npm run lint`, `npm run build`, and mock/no-key mode.

### 5. DB-Backed Product Retrieval

Allowed changes: `searchProducts` internals, server-only data access needed by
retrieval, focused tests or fixtures if a test runner is introduced, and docs
for the new retrieval source.

Forbidden changes: browser API shape, UI contract, LLM selecting products,
product facts generated by the model, RAG/vector search, and unrelated ranking
abstractions.

Verification: `npm run lint`, `npm run build`, retrieval parity checks against
representative catalog queries, debug output inspection, mock/no-key mode, and
real mode smoke check when credentials are available.

### 6. Optional Source Documents / RAG

Allowed changes: source document tables and retrieval for non-product facts
only, after DB-backed product retrieval is stable.

Forbidden changes: using RAG as the source of product facts, replacing
structured product retrieval, adding order/customer context, or adding vector
infrastructure without a concrete document recall need.

Verification: source attribution checks, product-fact grounding checks,
`npm run lint`, `npm run build`, and regression checks that product
recommendations still come from product records.

## Deferred Scope

Still deferred: auth/accounts, cart/checkout/payments, rate limiting until
production traffic, self-hosted database ops, Docker, vector database,
embeddings, document ingestion pipeline, orders/customer context, local model
optimization, multi-turn memory, agent frameworks, monorepo, analytics, i18n,
and Notino-scale catalog.

## Guardrails

- Keep product facts in product records and deterministic retrieval.
- Keep provider SDK usage and secrets server-side.
- Keep `LLM_MODE=mock` working without `OPENAI_API_KEY`.
- Keep CI install as plain `npm ci`; do not add package install workarounds.
- Generate dependency and lockfile changes from Linux/WSL or equivalent Linux.
- Update `API_CONTRACTS.md`, `ARCHITECTURE.md`, and `DECISIONS.md` only when
  the implementing issue changes their owned topics.
