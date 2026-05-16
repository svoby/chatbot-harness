# Deferred Scope

Items we explicitly chose **not** to build in this prototype phase.
Adding any of these requires a new entry in [DECISIONS.md](DECISIONS.md) and user approval.

| Item | Reason deferred |
|---|---|
| Auth / accounts / sessions | Out of scope for a learning prototype; adds friction with no product value at this stage |
| Basket / checkout / payments | Not a commerce platform; this is a recommendation assistant |
| Rate limiting | No auth, no production traffic; revisit at M7 (Vercel deploy) |
| Real database (SQLite/Postgres/Prisma) | 10–20 item catalog fits in a JSON file; no query complexity to justify DB. See M8. |
| Vector database / embeddings / RAG | A 20-item structured catalog doesn't need semantic recall; structured filter is sufficient |
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
