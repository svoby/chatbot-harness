---
name: manual-git-finish
description: >-
  Human-driven wrap-up for a git branch: reconcile with repo rules, delete only
  disposable local build/test output folders, commit, push, and merge into
  main/master or the correct base branch. Use when the user asks to finish a branch,
  clean noise before commit, push and merge, or invokes manual-git-finish.
disable-model-invocation: true
---

# Manual Git Finish

Use this skill when the **user explicitly** wants to land work: remove known-safe output directories (see below), commit, push, and merge—either into the repo default branch (`main` / `master`) or into the long-lived branch this work actually branched from.

This is a **manual / human-approved** workflow. It does **not** replace day-to-day agent rules: automated sessions should still follow `.cursor/rules/feature-branching.mdc` (no surprise merges) unless the user is clearly running **this** finish flow.

## 1. Re-read task and repo instructions

Before changing git state:

1. Map remaining work to the **original task** (scope, done criteria).
2. Open and apply relevant repo guidance, e.g.:
   - `.cursor/rules/feature-branching.mdc` — branch naming, what belongs on feature branches.
   - `.cursor/rules/post-feature-diff-audit.mdc` — if the fix took multiple iterations, classify the diff before calling it done.
   - `AGENTS.md` — verification expectations for this repo.
3. Run or cite verification the task requires (e.g. `npm run lint`, `npm run test`, `npm run build` when the project defines them).

Add any checkout-specific checks the user named (CI, e2e, manual chat smoke).

## 2. Inspect working tree

From repo root:

```bash
git status
git branch --show-current
git remote -v
```

- **Intentional changes** should be staged or clearly listed for commit.
- **Noise** is often rebuild output under the folders below. Do **not** run blanket `git clean -fdx` unless the user explicitly wants that destructive cleanup.

## 3. Remove only disposable output folders (allowed list)

**Goal:** Delete **only** directories that are standard local/generated output for Node/Next-style apps (adjust names if your stack differs):

| Path | Typical purpose |
|------|-----------------|
| `.next/` | Next.js dev/build cache |
| `out/` | Next static export output |
| `dist/` | Generic build output |
| `coverage/` | Jest/Vitest coverage HTML/lcov |

**Preview** (PowerShell):

```powershell
Get-ChildItem -Directory -ErrorAction SilentlyContinue .next, out, dist, coverage
```

**Remove** (PowerShell, from repo root):

```powershell
foreach ($d in '.next','out','dist','coverage') {
  if (Test-Path -LiteralPath $d) { Remove-Item -LiteralPath $d -Recurse -Force }
}
```

**Do not** delete `node_modules/` in this workflow unless the user explicitly asks.

**Optional:** stray `*.log` under repo root — out of scope unless the user names them.

## 4. Commit

1. `git diff` / `git diff --staged` — ensure the patch matches the task.
2. Stage: `git add -A` or selective paths.
3. Commit with a message that matches team convention (short subject, body if needed).

## 5. Push

```bash
git push -u origin HEAD
```

If the branch exists remotely, a plain `git push` may suffice.

## 6. Choose merge target

**Default:** merge into the **default trunk** the team uses (`main` or `master`), after fetch:

```bash
git fetch origin
```

Detect default remote branch (when configured):

```bash
git symbolic-ref refs/remotes/origin/HEAD
```

**If work branched from another long-lived branch** (e.g. `develop`, `release/x`): prefer the branch name the user gives; otherwise ask.

## 7. Merge (prefer PR; local merge optional)

**Preferred (review trail):** open a PR, get review, merge via UI (or `gh pr merge` if that is the team workflow).

**Local merge** only if the user wants it locally; follow team merge vs rebase vs squash policy.

## 8. Quick checklist

- [ ] Task scope and repo rules re-read; verification done as required.
- [ ] Disposable build folders removed only when the user wanted that cleanup.
- [ ] Commit contains only intentional changes.
- [ ] Pushed; merge target confirmed.
- [ ] Landed via PR or explicit local merge per user instruction.
