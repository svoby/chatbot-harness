---
description: Clean up docs/ so agents do not treat historical plans as source-of-truth.
---

Model: your default strong model.

Mode: Agent / Composer.

Task type: documentation hygiene only.

Goal:
Clean repository documentation under `docs/` so agents do not treat historical plans, audits, checkpoints, or “next steps” as current truth.

Read first:
- `README.md`
- `AGENTS.md` (when present)

Rules:
- Do not modify production app code unless a doc incorrectly references paths that must align (prefer fixing the doc).
- Do not implement product features during this prompt.
- Do not create new planning backlogs masquerading as docs.
- If a historical note contains **one durable rule**, move that rule into a stable doc, then delete or archive the note.

Classify each file under `docs/` as one of:

1. Stable source-of-truth documentation  
2. Durable technical reference  
3. Historical audit/checkpoint/plan  
4. Obsolete or misleading  

Desired final state:
- Prefer `docs/` for stable architectural and operational reference only.
- Prefer no “Next steps”, “Roadmap checkpoints”, temporary checklists, or stale “not implemented” claims—unless intentionally maintained as external product specs (then label them clearly).

If archiving beats deletion: use `archive/notes/` with a banner:
`Historical note. Not source of truth.`

Inspect especially filenames or sections referencing: Next Steps, Plan, Audit, Checkpoint, Future work.

Deliverable summary:
- kept vs deleted vs archived paths
- durable rules migrated (if any)
