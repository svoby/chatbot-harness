# Agent guide - AI Product Assistant

## Start here

**Read `docs/README.md` first.** It is the entrypoint for the project memory system:
which doc to read for what, and the update protocol every agent must follow.

Then read `docs/AGENT_GUIDE.md` for operating rules specific to AI agents.

## What This Project Is

A small fullstack Next.js app demonstrating an AI product recommendation assistant.
See `docs/PROJECT_BRIEF.md` for the goal, the one architectural invariant, and non-goals.

## Source Of Truth

This file is the root source of truth for repository safety and agent workflow.
Tool-specific rules and skills are adapters; they must mirror this guide, not redefine it.

Precedence:

1. `AGENTS.md` defines repo safety and workflow rules.
2. A GitHub issue defines the task contract for issue-driven work.
3. The issue's Required context section lists files the agent must read before editing.
4. `.cursor/rules/**`, `.cursor/skills/**`, and prompts provide tool-specific workflow help only.

## Where To Look

- `docs/` - project memory: brief, architecture, slice definition, API contracts, roadmap, decisions.
- `.cursor/rules/` - always-on and file-scoped adapters:
  - `project-memory.mdc` - doc reading and update protocol.
  - `assistant-grounding.mdc` - LLM grounding invariant (`server/**`, `app/api/**`).
  - `feature-branching.mdc` - git policy adapter for this guide.
  - `ai-chatbot-security.mdc` - security rules (no keys in client bundles).
  - `next-typescript-react.mdc` - TypeScript/React conventions.
  - `post-feature-diff-audit.mdc` - post-iteration diff audit checklist.
- `.cursor/skills/` - opt-in workflows (`manual-git-finish`, doc audit before coding).
- `.cursor/prompts/` - reusable task prompts.
- `.cursor/agents/` - review agent config.

## Product Invariants

> The LLM is never the source of product facts.
> Products come from `server/tools/searchProducts.ts`. The LLM only explains them.

Additional invariants:

- LLM/provider keys and SDK calls stay server-side only.
- Mock/no-key mode must keep working without `OPENAI_API_KEY`.
- Do not add databases, vector stores, auth, queues, agent frameworks, or deployment
  infrastructure unless explicitly approved and recorded in `docs/DECISIONS.md`.

## Git Workflow

These rules are agent-agnostic. Codex, Cursor, Claude, and other coding agents must
follow the same branch, commit, push, and PR semantics even if their tool names differ.

### Ad-hoc Work

For non-issue work, stay conservative:

- Do not create or switch branches unless the user asks.
- Do not stage, commit, push, open a PR, merge, or rebase unless the user asks.
- When wrapping up, you may write an intended commit message to `.git/COMMIT_EDITMSG`
  for human review instead of committing.

### GitHub Issue Workflow

When the user uses the minimal launcher prompt:

```text
Implement GitHub issue #N.
```

fetch the issue and treat its body as the task contract. The human should not need to
repeat the required context files, branch name, PR title, verification commands, or
acceptance criteria when the issue already contains them.

Issue-driven work may create the issue branch, commit, push, and open a PR without
separate permission. It must not merge the PR unless a human explicitly requests it.

Workflow:

1. Read `AGENTS.md`, fetch the issue, and verify it against current `master`.
2. Stop and report if the issue is stale, incomplete, contradictory, or out of scope.
3. Read every file listed in the issue's Required context section before editing.
4. Create the branch named by the issue. If none is named, use `issue-N-<short-slug>`.
5. Implement only files and behavior authorized by the issue.
6. Verify the diff before committing; unexpected files mean stop and report.
7. Run the verification the issue requests. For this Next.js app, common checks are
   `npm run lint`, `npm run build`, and `npm run typecheck` only when that script exists
   or the issue explicitly adds it.
8. Commit and push the scoped change.
9. Open a PR against `master` unless the issue specifies another base.

Every issue-driven PR body must include:

- Summary
- Changed files
- Context read
- Verification performed, or an explicit explanation if not run
- Known risks / follow-ups
- `Closes #N`

### Parallel Issue Work And Worktrees

- One issue = one branch = one PR.
- For parallel issue agents, also use one isolated worktree or checkout per issue.
- Never let two agents share the same mutable working directory.
- Run parallel issue agents only when their allowed file sets do not overlap.
- Before editing, check current branch/status and open PRs for overlap with the issue's
  allowed files.
- For a single issue in the current checkout, creating the issue branch is enough;
  worktrees are required only for parallel work or when the launcher environment provides them.

## Done Criteria

- Final diff is intentional and scoped to the request or issue.
- Product invariants remain intact.
- Required docs are updated when types, boundaries, or decisions change.
- Verification is run as requested, or the gap is stated clearly.
- Agents never merge PRs unless a human explicitly requests it.
