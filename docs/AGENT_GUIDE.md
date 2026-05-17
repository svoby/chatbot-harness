# Agent Guide

Operating rules for AI coding agents (Cursor, Claude, etc.) working in this repo.
`../AGENTS.md` is the root source of truth for repository safety and agent workflow;
this file summarizes project-specific operating rules.

## Start of every session

1. Read [docs/README.md](README.md) - the doc map and update protocol.
2. Read [docs/PROJECT_BRIEF.md](PROJECT_BRIEF.md) - the invariant and non-goals.
3. Read [docs/ARCHITECTURE.md](ARCHITECTURE.md) before any change that crosses layers.
4. Read [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) only to
   understand sequencing or create the next GitHub issue. For implementation,
   follow the GitHub issue body as the task contract.

## Core rules

### Stay in scope
- Work on one approved issue at a time. Do not implement directly from the
  implementation plan or pre-implement later work from it.
- Agents must not pick arbitrary open issues. An issue is executable only when
  it has `agent-ready` and does not have `blocked` or `needs-human`.
- `type:*` labels describe the kind of work; `area:*` labels describe the
  affected domain. If labels conflict with the issue body, stop and ask for
  clarification.
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
- After opening an issue-driven PR, run the PR review gate and publish the verdict on
  the PR before handoff. The implementation agent must initiate this step. Prefer an
  independent reviewer/subagent when the tool permits it; otherwise perform the same
  review pass in-agent and state that independent review was unavailable.
- One issue = one branch = one PR. Parallel issue agents require isolated worktrees
  or checkouts, `parallel-ready` on every issue, and non-overlapping allowed file
  areas in the issue bodies.
- Worktrees are temporary isolation for active issue work. Once the PR is merged
  and the checkout is clean, remove the worktree; prune stale worktree metadata
  when `git worktree list` points at missing paths.
- Agents never merge PRs unless a human explicitly requests it.

## Label guide

- `agent-ready`: issue is ready for an agent to execute.
- `parallel-ready`: issue may run beside another active issue only when the issue
  body declares non-overlapping allowed files or areas and a separate worktree or
  checkout is used.
- `blocked`: agent must not start until the blocker is removed.
- `needs-human`: waits for a human-owned step such as account setup, billing,
  credentials, secrets, production URLs, or external service configuration.
- `type:planning`, `type:cleanup`, `type:readiness`, `type:implementation`, and
  `type:review`: kind of work.
- `area:docs`, `area:deploy`, `area:llm`, `area:data`, `area:retrieval`,
  `area:ui`, `area:ci`, and `area:agent-workflow`: affected domain.

## Escalation

If a decision is ambiguous, ask the user rather than guessing. Prefer a short
clarifying question over an implementation that needs to be reverted.

## Environment Boundaries

Follow the full environment, sandbox, timeout, credential, and process-lock policy
in `../AGENTS.md`.

- Treat GitHub Actions Ubuntu as the dependency reproducibility source of truth.
  CI install stays `npm ci`; do not patch CI with `npm install --no-save`.
- Generate lockfile/dependency changes from Linux/WSL or equivalent Linux unless
  explicitly instructed otherwise.
- After one failed sandbox attempt and one justified fallback attempt, stop and
  report the blocker plus the next human command/tool action needed.
- Launcher/UI permissions are the effective boundary when they are stricter than
  local config files.
- Use short timeouts for ordinary inspection commands; reserve long waits for
  installs, builds, tests, large downloads, and GitHub/network operations.
- For `node_modules` or native package locks, run one focused diagnostic pass,
  then ask the human to close the likely process or run the named command.
- In WSL/Ubuntu sessions, `gh` means GitHub CLI and is acceptable standard
  local tooling alongside `git` for repository and PR operations when
  credentials are configured. MCP/ChatGPT/GitHub connector tooling remains
  useful for ChatGPT-side review, issue creation, PR comments, and repo
  inspection, but it is not mandatory for every local shell operation.
- If `gh` is missing, report that and point to the official GitHub CLI install
  docs. If authentication is missing, use one focused `gh auth status` /
  approved `gh auth login` path, then follow the existing credential stop-gate.
- Keep dependency and CI verification in WSL/Ubuntu even when GitHub operations
  happen through approved connector/tooling or an allowed Windows Git fallback.
