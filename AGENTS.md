# Agent guide — AI Product Assistant

## Start here

**Read `docs/README.md` first.** It is the entrypoint for the project memory system:
which doc to read for what, and the update protocol every agent must follow.

Then read `docs/AGENT_GUIDE.md` for operating rules specific to AI agents.

## What this project is

A small fullstack Next.js app demonstrating an AI product recommendation assistant.
See `docs/PROJECT_BRIEF.md` for the goal, the one architectural invariant, and non-goals.

## Where to look

- `docs/` — project memory: brief, architecture, slice definition, API contracts, roadmap, decisions.
- `.cursor/rules/` — always-on and file-scoped rules:
  - `project-memory.mdc` — doc reading and update protocol.
  - `assistant-grounding.mdc` — LLM grounding invariant (server/**).
  - `feature-branching.mdc` — git policy (no surprise commits/branches).
  - `ai-chatbot-security.mdc` — security rules (no keys in client bundles).
  - `next-typescript-react.mdc` — TypeScript/React conventions.
  - `post-feature-diff-audit.mdc` — post-iteration diff audit checklist.
- `.cursor/skills/` — opt-in workflows (`manual-git-finish`, doc audit before coding).
- `.cursor/prompts/` — reusable task prompts.
- `.cursor/agents/` — review agent config.

## Key invariant

> The LLM is never the source of product facts.
> Products come from `server/tools/searchProducts.ts`. The LLM only explains them.

## Git

See `.cursor/rules/feature-branching.mdc` — no surprise branch switches; never commit unless asked.
