# DialogLingo v1 Follow-up TODO

This document tracks scoped follow-up plans after the candidate mining + preclean/tool-noise slice.

## Checkpoint Persistence

- Implement auditable persistence before full resume: write `generation_job_sessions`, `candidate_groups`, `enrichment_batches`, and `ranked_orders`.
- Keep failed/cancelled diagnostics tied to the persisted checkpoint stage.
- Treat true checkpoint resume as a separate follow-up once persisted artifacts are reliable.

## Search Preview Code/Log Collapse

- Collapse code/log/tool-noise-heavy turns in search preview rendering without removing raw search index text.
- Preserve query highlighting and source-span navigation semantics.
- Keep this separate from generation pre-cleaning so search recall does not regress.
