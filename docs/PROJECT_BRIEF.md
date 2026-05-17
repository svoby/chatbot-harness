# Project Brief

## What this is

A small, learning-oriented AI Product Assistant for e-commerce skincare.
The goal is to demonstrate and teach one canonical pattern — not to build a platform.

### The pattern

```
natural language query
  → server-side orchestrator
  → intent/constraint extraction
  → product search tool over a local catalog
  → ranked candidates
  → grounded LLM explanation
  → structured ChatResponse
  → React UI (product cards, reasons, follow-up chips)
```

## The one architectural invariant

> **The LLM is never the source of product facts.**

Products, prices, attributes, and stock status come exclusively from
`server/tools/searchProducts.ts` and the catalog it reads.

The LLM is permitted to:
- Extract user intent.
- Write prose explanations *over already-selected products*.

The LLM must never:
- Invent product names, prices, or attributes.
- Be the decision-maker for which products appear in recommendations.

This invariant is enforced by: the `LLMAdapter` interface, the system prompt,
`ProductRecommendation.reasons` being derived from tool output, and the
`.cursor/rules/assistant-grounding.mdc` always-applied rule.

## Non-goals

See [DEFERRED_SCOPE.md](DEFERRED_SCOPE.md) for the full list and rationale.
Short version: no auth, no basket, no payments, no vector DB, no RAG, no agent
framework, no Docker, no multi-turn memory, no i18n, and no Notino-scale
catalog. Managed Postgres is an approved MVP direction only through an explicit
implementation issue.

## Related docs

- Architecture details → [ARCHITECTURE.md](ARCHITECTURE.md)
- MVP direction → [MVP_ARCHITECTURE.md](MVP_ARCHITECTURE.md)
- Current implementation plan → [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
