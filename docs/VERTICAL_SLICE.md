# Vertical Slice — v1

## The slice

**User query:**
> "I have oily sensitive skin and want SPF under 500 CZK, ideally fragrance-free."

**Expected response:**

| Element | Description |
|---|---|
| Assistant message | 1–2 sentences, grounded in tool output |
| Product cards | 2–3 cards (name, brand, price, key attribute tags) |
| Per-card reasons | Bullet list; each reason derivable from `Product` fields |
| Follow-up chips | 2–3 suggestions (e.g. "Show only gel texture", "Under 350 CZK") |
| Debug panel | Collapsible — shows `ExtractedIntent`, tool I/O, `llmMode` (M6) |

## Definition of done ✅

- [x] `POST /api/chat` returns a fully typed `ChatResponse` for the example query.
- [x] All product fields displayed in the UI exist in the tool result — no LLM-invented facts.
- [x] Empty-result path (no products match) degrades gracefully with a helpful message.
- [x] No-LLM-key path (`LLM_MODE=mock`) works end-to-end without an API key.
- [x] Debug panel renders `intent`, `tool`, and `llmMode` (M6 ✅).

## What this slice is NOT

- Not a generic chatbot (unstructured prose only). Response always has `recommendations[]`.
- Not multi-turn (each request is independent).
- Not personalized (no user accounts).

See [DEFERRED_SCOPE.md](DEFERRED_SCOPE.md).
