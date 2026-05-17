# Decisions

Append-only log of non-trivial technical decisions.
Format: `## YYYY-MM-DD — Title` then context / decision / consequences.

---

## 2026-05-12 — Tailwind CSS as styling approach

**Context:** Choosing a styling system for the prototype.
**Decision:** Tailwind CSS 4 (included in Next.js 16 scaffold default).
**Consequences:** Utility-class styling throughout UI components. No parallel CSS system introduced.

---

## 2026-05-12 — LLM provider: OpenAI (gpt-4o-mini)

**Context:** Need to choose a provider (OpenAI, Anthropic, etc.) for real LLM calls.
**Decision:** OpenAI with `gpt-4o-mini`. Cost-effective, wide tooling, native JSON-mode support.
  Mock LLM used through M4; `gpt-4o-mini` active at M5 when `LLM_MODE=real`.
**Consequences:** `OPENAI_API_KEY` required for real mode. System still fully functional without
  it via `LLM_MODE=mock` (deterministic fallback in both intent extraction and explanation).
  Can switch to Anthropic or other provider by replacing `server/llm/provider.ts`; interface unchanged.

---

## 2026-05-12 — No validation library (no zod)

**Context:** Route boundary needs input validation.
**Decision:** Hand-written lightweight guard at the route level for now.
  Add `zod` only when a second validation use-case appears.
**Consequences:** Less boilerplate; no extra dependency. Revisit if validation logic grows.

---

## 2026-05-12 — No testing framework in first slices

**Context:** When to introduce Vitest/Jest.
**Decision:** Deferred. Revisit if a regression bites, or before M5 (grounding contract is subtle enough to warrant tests).
**Consequences:** No test runner configured in M0–M4. Smoke-checking done manually.

---

## 2026-05-12 — Adapter rule

**Context:** When to introduce an abstraction/interface.
**Decision:** Introduce an adapter only when there are 2 real implementations OR 1 real + 1 test double we actually use.
**Consequences:** Prevents premature abstraction. `CatalogRepository`, `RankingStrategy`, `PromptTemplate` etc. not created until that bar is met.

---

## 2026-05-12 — server-only package for server modules

**Context:** Preventing accidental client-side imports of server modules.
**Decision:** All `server/**` files carry `import "server-only"` at the top. Next.js build fails fast on violations.
**Consequences:** Explicit boundary enforcement. Requires `server-only` npm package.

---

## 2026-05-16 — Agent environment and retry boundaries

**Context:** CI baseline work exposed repeated friction across Linux/WSL, Windows Git
credentials, sandbox permissions, npm cache/log writes, native package locks, and
ordinary commands hanging longer than their purpose justified.
**Decision:** GitHub Actions Ubuntu is the dependency reproducibility source of truth;
lockfile/dependency changes should come from Linux/WSL or equivalent Linux; agents
must stop after one failed sandbox attempt and one justified fallback attempt; UI
launcher permissions are treated as the effective boundary; Docker remains deferred.
**Consequences:** Future agents should report exact blockers sooner, keep CI on
plain `npm ci`, avoid CI package-install workarounds, and avoid long credential or
process-lock troubleshooting loops unless a human explicitly asks for them.

---

## 2026-05-16 — GitHub CLI is normal WSL agent tooling

**Context:** Local WSL agents need a clear GitHub operation path without debating
`gh`, raw git, MCP, or connector tooling each session.
**Decision:** Treat `gh` (GitHub CLI) and `git` as standard WSL/Ubuntu local tools
when credentials are configured; use MCP/ChatGPT/GitHub connector tooling as an
alternative control plane, not a mandatory replacement.
**Consequences:** Missing or unauthenticated `gh` should be reported through the
existing credential stop-gate, while dependency and CI verification stay in WSL.

---

## 2026-05-16 — MVP production path uses managed services

**Context:** The project needs a concrete path from local harness to deployable
product assistant without turning into a platform or infrastructure exercise.
**Decision:** Keep GitHub as source of truth, use a small Next.js deployment
shape such as Vercel, use cloud model APIs first, and use managed Postgres as
the database direction once the JSON catalog is outgrown.
**Consequences:** No infrastructure is implemented by this decision. Mock/local
mode remains required for development and CI; provider and database credentials
must stay server-side; Docker and self-hosted database ops remain deferred.

---

## 2026-05-16 — Product retrieval precedes RAG

**Context:** The assistant's core invariant is that the LLM never invents
product facts, and the current catalog retrieval is deterministic.
**Decision:** Move from local JSON to DB-backed deterministic product retrieval
before adding document/FAQ RAG, embeddings, vector search, orders, or customer
context.
**Consequences:** Product facts continue to come from product records. Source
documents and retrieval chunks are introduced only for non-product facts after
product DB retrieval is stable.

---

## 2026-05-17 — Docs keep current truth, not bootstrap history

**Context:** Bootstrap-era roadmap and vertical-slice docs were being read next
to the current MVP implementation issue plan, creating duplicate sources for
what to build next.
**Decision:** Keep `docs/IMPLEMENTATION_PLAN.md` as the current issue-writing
plan, keep stable reference docs, and delete historical bootstrap roadmap/slice
documents instead of archiving them.
**Consequences:** Agents should use stable docs for product and architecture
truth, then use the implementation plan for follow-up issue creation.

---

## 2026-05-17 — Postgres foundation uses `pg` with SQL-first migrations

**Context:** MVP step 4 needs managed Postgres connectivity and initial schema
foundation without changing `searchProducts` authority or requiring DB env vars
for mock/no-key runs.
**Decision:** Use the lightweight `pg` client in server-only modules plus
checked-in SQL migration files under `server/db/migrations`.
**Consequences:** Database access is prepared for future seed/retrieval steps
while current product retrieval remains catalog-backed. DB setup stays optional
for local/CI build checks, and migrations can be applied explicitly via
`DATABASE_URL` and `npm run db:migrate`.
