---
name: pr-review-gate
description: Run after opening an issue-driven PR in this repo. Review the final PR diff against the issue contract, publish a visible PR review comment, and do not hand off for human merge until the verdict is acceptable or the posting blocker is reported.
---

# PR Review Gate

Use this after an issue-driven implementation PR is opened and before final handoff.

## Required inputs

- Issue number and task contract.
- PR number and URL.
- Base branch and head branch.
- Final diff or PR changed files.
- Verification commands and results.
- Required context files that were read.

## Procedure

1. Inspect the PR diff against the issue contract and allowed scope.
2. Check product invariants:
   - The LLM is never the source of product facts.
   - LLM/provider keys and SDK calls stay server-side.
   - Mock/no-key mode remains intact.
   - No unapproved DB, vector store, auth, queue, agent framework, deployment, or dependency churn.
3. Check correctness, security, client/server boundaries, accessibility risks, tests, docs, and unrelated churn.
4. Classify findings as:
   - Blocker: must fix before merge.
   - Major: should fix before merge.
   - Minor: small cleanup or clarity.
   - Note: acceptable tradeoff or future follow-up.
5. Publish a visible PR review result:
   - Prefer a formal GitHub PR review if the tool supports it.
   - Otherwise post a top-level PR comment.
6. If findings include Blocker or Major issues, return to implementation, fix them, rerun requested verification, push, and run this gate again.

## PR comment format

```md
## Automated Review Gate

Verdict: accept | accept with small fixes | reject

Scope: in scope | scope concerns
Verification reviewed:
- ...

Findings:
- Blocker: ...
- Major: ...
- Minor: ...
- Note: ...

Merge readiness:
...
```

Use `accept` only when no blocker or major issues remain. Use `accept with small fixes`
only for minor/non-blocking follow-ups that a human can reasonably merge with.
