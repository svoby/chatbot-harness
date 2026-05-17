# GitHub-hosted Remote Agent Pilot (Manual, Scoped)

## Scope and intent

This document is only for a **manual GitHub-hosted remote agent pilot**.

The existing local WSL/Codex/Cursor development loop remains unchanged and is still the trusted fallback path.

## Manual pilot flow

1. Prepare a small, clearly scoped issue with explicit acceptance criteria.
2. In GitHub, manually use **Assign to agent** (or equivalent hosted-agent UI).
3. Let the hosted agent create a branch and draft PR.
4. Review the PR manually for scope, quality, and safety.

## When to try the remote agent

Use this pilot path only when all of the following are true:

- Change is small and scoped (documentation or similarly low-risk code updates).
- Acceptance criteria are clear and testable.
- No secrets are required.
- No broad refactors are involved.
- No deployment, runtime behavior, or security-sensitive changes are included.

## Minimum assignment prompt pattern

Use a short prompt with explicit scope and boundaries, for example:

```text
Implement this as a small, scoped GitHub-hosted remote-agent task.

Allowed change:
- <list exact file(s) and expected outcome>

Do not:
- broaden scope
- modify unrelated files
- introduce deployment/runtime/security changes

Before finalizing the PR:
- run available lint/test/build checks if supported in the cloud environment
- state exactly which checks were run (or could not be run) in the PR description

Open a draft PR and keep the diff reviewable.
```

## Checks and verification rule

The remote agent should run available lint/test/build checks before finalizing the PR when the cloud environment supports them.

The PR description should explicitly list which checks were run.

GitHub Actions / PR CI, where available, is the authoritative verification gate.

## Fallback rule

If the remote agent creates a broad diff, fails checks, ignores scope, or gets stuck, abandon or close that PR and continue the work locally.

## Review rule

Remote-agent PRs require human review and CI (where available) before merge.

## Non-goals

This pilot does **not**:

- add GitHub Actions automation
- add label-triggered execution
- build a custom SDK worker/orchestrator
- change application runtime behavior
- modify existing local-agent instructions unless explicitly required by another issue
