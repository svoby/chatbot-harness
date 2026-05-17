# Deferred Scope

Items we explicitly chose **not** to build in this prototype phase.
Adding any of these requires a new entry in [DECISIONS.md](DECISIONS.md) and user approval.

| Item | Reason deferred |
|---|---|
| Auth / accounts / sessions | Out of scope for a learning prototype; adds friction with no product value at this stage |
| Basket / checkout / payments | Not a commerce platform; this is a recommendation assistant |
| Rate limiting | No auth and no production traffic yet; revisit only when a deployment issue introduces real exposure |
| Real database implementation | Current 10–20 item catalog fits in JSON. Managed Postgres is the MVP direction, but implementation waits for an explicit database issue. See [MVP_ARCHITECTURE.md](MVP_ARCHITECTURE.md). |
| Vector database / embeddings / RAG | Product retrieval must move to stable structured DB search before document/FAQ RAG or embeddings are introduced |
| Self-hosted database operations | Managed Postgres is the MVP direction; avoid learning database ops, Dockerized parity, or self-hosting during the MVP |
| Document/FAQ ingestion pipeline | Add `sources` / `source_documents` only after product retrieval is DB-backed and stable |
| Orders / customer context | Optional demo layer only; defer until product retrieval and source boundaries are reliable |
| Local model optimization | Cloud model API is the MVP path; keep mock mode but do not spend MVP cycles tuning local models |
| Multi-turn conversation memory | One request per conversation is enough to demonstrate the pattern |
| Agent framework (LangChain, LlamaIndex, Vercel AI SDK, etc.) | Adds opacity; deterministic orchestrator teaches the pattern more clearly |
| Docker / separate backend service | Single Next.js app is the right shape; no need for a sidecar at this scale. Do not introduce Docker only to solve npm optional native package parity. |
| Monorepo / Turborepo | One package; no shared code across apps |
| Analytics / A/B / tracking | No users to track |
| i18n framework | UI in English; prices in CZK as literal data values |
| Notino-scale catalog | 10–20 curated SKUs is the target; scale only if pattern is proven |
| CatalogRepository interface | Only one data source; interface is premature (see adapter rule in DECISIONS.md) |
| RankingStrategy interface | One ranker; no second implementation |
| Telemetry / observability adapter | No production traffic yet |
| DI container | Overkill for a two-adapter system |
