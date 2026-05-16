# Agent Guide

Operating rules for AI coding agents (Cursor, Claude, etc.) working in this repo.
`../AGENTS.md` is the root source of truth for repository safety and agent workflow;
this file summarizes project-specific operating rules.

## Start of every session

1. Read [docs/README.md](README.md) - the doc map and update protocol.
2. Read [docs/PROJECT_BRIEF.md](PROJECT_BRIEF.md) - the invariant and non-goals.
3. Read [docs/ARCHITECTURE.md](ARCHITECTURE.md) before any change that crosses layers.
4. Read [docs/ROADMAP.md](ROADMAP.md) to know which milestone you're working on.

## Core rules

### Stay in scope
- Work on **one milestone at a time**. Do not pre-implement future milestones.
- If scope needs to expand, stop and ask the user.

### Keep diffs small
- A milestone should be completable in one focused session.
- After messy iteration (multiple fix cycles), run the `post-feature-diff-audit.mdc` checklist.

### Never let the LLM invent product facts
- `ProductRecommendation.reasons` must be derivable from `Product` fields returned by `searchProducts`.
- The LLM may only explain products that appear in the tool result. See [PROJECT_BRIEF.md](PROJECT_BRIEF.md).

### Keep LLM calls server-side only
- LLM SDK and provider keys live only in `server/llm/**`.
- `NEXT_PUBLIC_*` is forbidden for any LLM or provider config.
- The `import "server-only"` guard in `server/**` enforces this at build time.

### Type safety
- No `any` in `shared/types/**` or `app/api/**`.
- When changing types, update [API_CONTRACTS.md](API_CONTRACTS.md) in the same change.

### No surprise infrastructure
- Do not add DBs, vector stores, auth systems, queues, or agent frameworks without
  a user-approved entry in [DECISIONS.md](DECISIONS.md).
- When tempted, add a one-liner to [DEFERRED_SCOPE.md](DEFERRED_SCOPE.md) instead.

### Update docs with architecture changes
- Folder layout change -> update [ARCHITECTURE.md](ARCHITECTURE.md).
- Type change -> update [API_CONTRACTS.md](API_CONTRACTS.md).
- New judgment call -> append to [DECISIONS.md](DECISIONS.md).
- PR description must list docs touched, or state "docs N/A".

## Git and issue workflow

Follow the full policy in `../AGENTS.md`; `.cursor/rules/feature-branching.mdc`
is only the Cursor adapter for that policy.

- For ad-hoc work, do not create/switch branches, stage, commit, push, open PRs,
  merge, or rebase unless the user explicitly asks.
- For GitHub issue work launched as `Implement GitHub issue #N.`, the issue body is
  the task contract and the agent may create the issue branch, commit, push, and open
  a PR without repeated permission.
- One issue = one branch = one PR. Parallel issue agents require isolated worktrees
  or checkouts and non-overlapping allowed file sets.
- Agents never merge PRs unless a human explicitly requests it.

## Escalation

If a decision is ambiguous, ask the user rather than guessing. Prefer a short
clarifying question over an implementation that needs to be reverted.
