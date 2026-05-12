# Documentation Map

This folder is the **project memory** for the AI Product Assistant prototype.
Every AI agent and new contributor should read this file first.

## Doc index

| File | Source of truth for | Read it when |
|---|---|---|
| [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | Product intent, architectural invariant, non-goals | Before any feature work |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, client/server boundary, folder layout, orchestration flow | Before changes that cross layers |
| [VERTICAL_SLICE.md](VERTICAL_SLICE.md) | Current slice definition + definition of done | Before/while building or extending the slice |
| [API_CONTRACTS.md](API_CONTRACTS.md) | `ChatRequest`/`ChatResponse`/`Product`/intent types and their semantics | Before changing any of those types |
| [ROADMAP.md](ROADMAP.md) | Milestones M0–M8 and what each one unlocks | When picking the next chunk of work |
| [DECISIONS.md](DECISIONS.md) | Append-only mini-ADRs (date, context, decision, consequences) | When making any non-trivial judgment call |
| [DEFERRED_SCOPE.md](DEFERRED_SCOPE.md) | Things explicitly chosen not to build yet, and why | When tempted to add infra, auth, DB, RAG, etc. |
| [AGENT_GUIDE.md](AGENT_GUIDE.md) | Operating rules for AI agents in this repo | At the start of every agent session |

## Update protocol

These rules apply to every agent and human contributor:

- **Changing a type** in `shared/types/**` → update `API_CONTRACTS.md` in the same change.
- **Changing folders or layer boundaries** → update `ARCHITECTURE.md`.
- **Saying "no" to a tempting addition** → append a one-liner to `DEFERRED_SCOPE.md`.
- **Making any judgment call** → append a dated entry to `DECISIONS.md`.
- **Commit/PR descriptions must list docs touched**, or explicitly state "docs N/A".

## Duplication rule

Docs must not restate each other. One doc owns each topic; others link instead of copy.
- Milestone details → `ROADMAP.md` only.
- Type definitions → `API_CONTRACTS.md` only.
- Folder layout → `ARCHITECTURE.md` only.
