# Roadmap

Each milestone is sized for one focused agent session.
Each milestone ends with a **runnable app** and updated docs.

> Anti-rule: do not bundle milestones. Complete and document each one before starting the next.

## M0 — Repo skeleton + docs ✅
- Next.js scaffold (TypeScript, App Router, Tailwind 4, ESLint).
- Full folder skeleton with placeholder files.
- All `docs/*.md` written.
- `.cursor/rules/project-memory.mdc` and `assistant-grounding.mdc` added.
- `AGENTS.md` updated.
- `.env.local.example` added.
- **No business logic yet.** `npm run dev` serves the default placeholder page.

## M1 — Static chat UI + mock route ✅
- `ChatPanel` client component: text input, send button, message list.
- `POST /api/chat` route returns a **hardcoded** `ChatResponse` (no orchestrator yet).
- `ProductCard`, `FollowUpChips` components render the hardcoded response.
- Shared types wired end-to-end.

## M2 — Local catalog + search tool ✅
- `server/data/catalog.json` with 18 SPF/skincare SKUs.
- `server/tools/searchProducts.ts`: constraint filter + weighted ranker (score 0..1).
- `catalog.ts` loads and exports typed `Product[]`.

## M3 — Orchestrator returns structured response ✅
- `server/assistant/orchestrator.ts`: `handleChat(req)` wired end-to-end.
- `server/assistant/intent.ts`: deterministic keyword/regex intent parser.
- `server/assistant/explain.ts`: delegates to LLM adapter (template or real).
- Route calls orchestrator; UI renders real product cards with grounded reasons.

## M4 — Intent parser polish + follow-up chips ✅
- Improved rule-based parser: CZK/Kč price patterns, SPF, fragrance-free, skin types, textures.
- Smart follow-up chips generated from unused/loose constraints.

## M5 — Real LLM behind adapter ✅
- Provider: OpenAI `gpt-4o-mini` (see [DECISIONS.md](DECISIONS.md)).
- `server/llm/provider.ts` implements `LLMAdapter` with JSON-mode structured output.
- Fallback to deterministic on parse failure for both intent and explain.
- Active when `LLM_MODE=real` and `OPENAI_API_KEY` is set.

## M6 — Debug panel ✅
- `ChatRequest.debug = true` flag propagated to orchestrator.
- `DebugPanel` component renders `ExtractedIntent`, tool I/O, `llmMode`.
- Collapsible toggle checkbox in `ChatPanel`.

## M7 — Deploy to Vercel *(optional)*
- Set provider key as Vercel env var.
- Smoke check on production URL.
- Add production link to root `README.md`.

## M8 — SQLite + Prisma *(optional)*
- Add Prisma, `@prisma/client`, `prisma-client-js` adapter.
- Seed script reads `catalog.json` and populates SQLite.
- Swap body of `server/data/catalog.ts`; `searchProducts` signature unchanged.
- Update [ARCHITECTURE.md](ARCHITECTURE.md) and [DECISIONS.md](DECISIONS.md).
