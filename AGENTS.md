# Agent guide — AI chatbot (Next / React)

This folder holds **Cursor/agent configuration** for a future or in-progress chatbot web app. It is not tied to the Unity Fusion prototype.

## Where to look

- `.cursor/rules/` — always-on and file-scoped guidance (git policy, security, React/TS).
- `.cursor/skills/` — opt-in human-driven workflows (`manual-git-finish`, doc audit before coding).
- `.cursor/prompts/` — reusable task prompts (e.g. docs hygiene).
- `.cursor/agents/` — review agents (e.g. `code-review`).

## Expectations

- Prefer **server-side** calls to LLM/providers; never ship API keys in client-exposed env vars.
- Keep diffs small and scoped; after messy iteration on a feature, follow `post-feature-diff-audit.mdc`.

## Git

See `.cursor/rules/feature-branching.mdc` for agent git constraints (no surprise branch switches; no commits unless asked).
