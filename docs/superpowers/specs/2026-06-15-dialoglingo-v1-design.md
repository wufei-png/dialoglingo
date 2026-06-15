# DialogLingo v1 Design

## Objective

Build `DialogLingo` as a local-first cross-platform desktop app that turns agent chat sessions into reviewed English-learning workbooks, then exports them primarily to Anki and secondarily to simple text bundle formats.

This v1 is not a general transcript browser, not a provider router, and not a long-term learning tracker. Its job is:

`local sessions -> selection -> generation -> review workbook -> export`

## Product Frame

DialogLingo is a standalone desktop app for macOS, Windows, and Linux. It should feel visually adjacent to Codex Desktop: light white/gray surfaces, restrained motion, and selective glass/translucent treatment on chrome and modal surfaces rather than dense list content.

The product is a review-and-export console for learning material derived from daily AI conversations. Users do not study inside DialogLingo long-term. They generate and clean up a workbook, then export it to Anki or text formats for downstream learning tools.

## Goals

- Auto-discover local sessions from `Codex`, `Claude Code`, and `OpenCode`.
- Auto-discover projects/workspaces from those sessions.
- Let users filter by `Time range`, `Platform`, and `Project`.
- Let users select sessions in bulk and by group.
- Generate two workbook item types: `Expression` and `Sentence`.
- Support mixed-language conversations. If source content is Chinese, the system may generate the English-side learning material; if source content is English, the system may generate the Chinese-side support material.
- Present generated items in a review workbook before export.
- Support edit, delete, restore, revert, and autosaved workbook drafts.
- Export Anki-first, with reliable text-bundle fallbacks.
- Reuse existing ecosystem pieces where practical instead of rebuilding them.

## Non-Goals

- No cloud sync, hosted account system, or team collaboration.
- No in-app spaced repetition history or mastery tracking.
- No public plugin marketplace in v1.
- No universal transcript parser that pretends all sources are identical.
- No direct support for arbitrary external gateways in v1 beyond `LiteLLM`.
- No broad global undo system across search, selection, generation, and export.
- No full workspace-admin product inside the main search flow.

## Recommended Stack

Recommend:

- Desktop shell: `Electron`
- UI: `React + TypeScript`
- Local database: `SQLite` with `FTS5`
- IPC/background work: Electron main process + typed job events
- Model call layer: TypeScript-side structured generation client
- Remote model gateway: `LiteLLM`

Rationale:

- The reuse surface we want most is currently strongest in the Node/TypeScript ecosystem: provider SDKs, OpenAI-compatible clients, existing transcript tooling, and export helpers.
- Electron is heavier than Tauri, but it reduces integration complexity for transcript ingestion, background jobs, and structured model workflows.
- The app’s core differentiation is not native-shell minimalism. It is the transcript-to-workbook pipeline. Optimize for engineering speed and ecosystem leverage first.

This recommendation does not prevent a later Tauri migration, but v1 should not split effort across two app-shell strategies.

## Information Architecture

DialogLingo has two top-level sections only:

1. `Search & Select`
2. `Workbook`

### Search & Select

The left side behaves like a Codex-Desktop-style rail plus session tree. The main pane shows the focused session content preview.

#### Left rail structure

- Top nav:
  - `Search & Select`
  - `Workbook`
- Filter header:
  - `Time range`
  - `Platform`
  - `Projects`
  - `Group by`
- Session tree:
  - grouped session rows
  - group-level bulk actions
  - session-level checkboxes
- Footer:
  - `Rescan`
  - `Settings`

Do not render six separate visual blocks. The filter controls should feel like a compact header above the session tree, not a dashboard of panels.

#### Search & Select defaults

On launch:

- auto-scan local sources
- auto-discover projects from indexed sessions
- default-select all discovered projects
- default-select all sessions
- default `Group by = Platform`
- groups default to collapsed
- the first available session is focused in the main pane

#### Project behavior

Projects are a filter scope, not a second-stage selection system and not a standalone admin screen.

- default unconfigured state: auto-discovered project list
- users can add local paths manually
- users can remove local paths manually
- selecting a project is itself the confirmation of filtering
- no second checkbox layer inside projects

#### Grouping behavior

Only one grouping mode may be active at a time:

- `Platform`
- `Time range`
- `Project`

Default grouping is `Platform`.

When grouped by `Time range`, groups are day-granularity and sessions inside a group sort from earlier to later.

#### Session row interaction

- Clicking a session row focuses preview only.
- Checkbox toggles selection only.

This avoids accidental deselection while browsing and stays closer to the Codex Desktop browsing mental model.

#### Main preview area

The main pane displays the focused session:

- session title
- source platform
- project/workspace path
- timestamps
- normalized or raw conversation preview
- highlighted snippets when relevant

Bottom sticky bar:

- selected session count
- `Generate workbook`

### Workbook

The Workbook section has two states.

#### State A: Progress

Show progress only while generation runs:

- progress bar
- sessions processed / total
- current session title
- current stage
- items created
- warnings / failures
- cancel button

Do not show half-built review tables during active generation.

#### State B: Review workbook

After completion, expand into the workbook review surface:

- tabs or filters such as:
  - `All`
  - `Expression`
  - `Sentence`
  - `Edited`
  - `Deleted`
- review table
- item detail drawer or inline expansion
- export button in top-right

Export opens a modal. Export is not its own page.

## Source Adapters

DialogLingo owns source normalization. It should not depend on one giant external search product at runtime.

Build explicit per-source adapters:

- `CodexAdapter`
- `ClaudeCodeAdapter`
- `OpenCodeAdapter`

Each adapter exposes:

- `listSessions(filters): SessionSummary[]`
- `readSession(sessionId): ConversationTurn[]`

### Reuse policy

Reuse discovery patterns, path knowledge, and official/local APIs where possible:

- Codex transcript paths and available app-server/thread discovery surfaces
- Claude Code session listing/message retrieval surfaces when available
- OpenCode CLI/SDK surfaces rather than scraping storage directly when possible

Do not build a fake universal parser that assumes one shared raw format.

## Local Data Model

DialogLingo persists both indexing state and workbook state locally.

### Tables

#### `projects`

- `id`
- `name`
- `local_path`
- `source_platforms_json`
- `discovered_at`
- `user_pinned`
- `is_active`

#### `sessions`

- `id`
- `source_type`
- `source_session_id`
- `project_id`
- `title`
- `started_at`
- `updated_at`
- `preview`
- `raw_locator`
- `hash`

#### `session_turns`

- `id`
- `session_id`
- `seq`
- `role`
- `language_hint`
- `text`
- `source_span_ref`
- `is_tool_noise`

#### `generation_jobs`

- `id`
- `created_at`
- `status`
- `selected_filters_json`
- `selected_session_count`
- `progress_json`

#### `generation_job_sessions`

- `job_id`
- `session_id`
- `snapshot_title`
- `snapshot_hash`

This freezes the selected input set for reproducibility.

#### `workbooks`

- `id`
- `job_id`
- `created_at`
- `status`

#### `workbook_items`

- `id`
- `workbook_id`
- `item_type`
- `generated_snapshot_json`
- `current_snapshot_json`
- `state`

`state` values:

- `active`
- `edited`
- `deleted`

#### `workbook_item_revisions`

- `id`
- `workbook_item_id`
- `action_type`
- `before_json`
- `after_json`
- `created_at`

This supports restore/revert behavior without requiring a global undo engine.

#### `export_runs`

- `id`
- `workbook_id`
- `export_type`
- `output_path`
- `created_at`
- `metadata_json`

## Workbook Item Model

v1 supports two primary learning-item types only.

### `Expression`

For:

- word
- phrase
- domain-specific term

### `Sentence`

For:

- full example sentence
- bilingual sentence
- focus-expression sentence
- sentence-based quiz item

Grammar is not a third independent item type in v1. If needed, represent grammar through `Sentence` explanation fields and tags.

### Canonical item shape

Every workbook item should normalize to:

- `id`
- `item_type`
- `source_language`
- `target_language`
- `source_text`
- `target_text`
- `gloss`
- `context_text`
- `explanation`
- `quiz_prompt`
- `quiz_answer`
- `tags`
- `source_refs`

## Generation Pipeline

The generation pipeline must not operate at the naive whole-session-to-LLM granularity.

### Flow

1. `scan`
   - discover sessions and projects
   - update local index
2. `select`
   - user filters and selects sessions
   - create `generation_job`
3. `normalize`
   - read selected sessions
   - normalize into conversation turns
4. `pre-clean`
   - remove tool noise
   - trim oversized code/log blobs
   - preserve useful mixed-language natural-language turns
5. `candidate mining`
   - local heuristics first
6. `LLM enrichment`
   - small bounded batches only
7. `global dedup + ranking`
   - merge near-duplicates across sessions
8. `workbook materialization`
   - create workbook items
9. `review`
   - edit/delete/restore/revert
10. `export`
   - only reviewed current-state active items are exported

### Candidate mining

Use local heuristics before the model:

- language detection
- phrase extraction
- frequency detection
- code-term filtering
- near-duplicate removal

The model should enrich candidate groups, not discover everything from scratch over raw transcripts.

## Ranking Strategy

Ranking should not be a pure black-box model decision.

Use three stages:

### 1. Hard filter

Remove obvious bad candidates:

- too short or too long
- pure path / URL / hash / shell fragment
- large code/log noise
- generic boilerplate
- near-duplicate junk

### 2. Heuristic scoring

Compute local interpretable scores:

- `recurrence_score`
- `context_score`
- `domain_score`
- `language_gap_score`
- `noise_penalty`
- `dup_penalty`

### 3. LLM enrichment signals

Ask the model for bounded structured hints:

- `item_type`
- `usefulness_score`
- `difficulty_band`
- `concise_rationale`
- `preferred_context`

### Final ranking

Start with a simple weighted score:

```text
final_score =
  0.30 * recurrence_score +
  0.20 * context_score +
  0.20 * domain_score +
  0.15 * language_gap_score +
  0.15 * usefulness_score
  - noise_penalty
  - dup_penalty
```

This is intentionally explainable and easy to tune.

## Provider and Model Strategy

v1 external model entry is intentionally narrow.

### Supported remote entry

- `LiteLLM` only

Do not support a wide matrix of remote entry types in v1.

### Future local entry

- `Ollama` may be added later

### Why LiteLLM-only for v1

- reduces provider-configuration surface
- reuses a mature routing/gateway layer
- keeps DialogLingo from becoming a provider router
- supports model diversity through one stable remote contract

### ModelAdapter

DialogLingo owns a thin `ModelAdapter` abstraction, but not a full provider platform.

It should accept:

- `base_url`
- `api_key`
- `model_name`
- generation settings needed for structured extraction

## Structured Output

Use structured output strongly, but only at LLM boundaries.

### Good uses

- `LearningItemDraft`
- `BatchExtractionResult`
- `WorkbookItemPatch`
- `ExportPreviewRow`

### Bad uses

- transcript parsing
- scan/index transport
- progress events
- revision logs

Keep schemas small. Prefer one item or a small array of items over giant all-in-one workbook schemas.

## Workbook Editing Model

The user requested a simpler alternative to a global undo system. Use this model:

- single delete:
  - no confirmation
  - move item to `Recently deleted`
- restore:
  - `Restore last deleted`
  - restore from `Recently deleted`
- batch delete:
  - lightweight confirmation
- editing:
  - `Save`
  - `Cancel`
  - `Revert`
- autosave:
  - autosave confirmed workbook draft state
  - do not silently commit unsaved edit-buffer changes

### Edit semantics

- `Cancel`: discard current unsaved edit buffer
- `Revert`: reset the item to its original generated snapshot

This avoids the complexity of a universal Ctrl+Z stack while preserving user trust.

## Progress Model

Progress must be job-stage based, not token-stream theater.

Emit typed events such as:

- `job.started`
- `session.normalized`
- `batch.started`
- `batch.completed`
- `items.materialized`
- `job.completed`
- `job.failed`

The UI should show:

- total session count
- processed session count
- current phase
- current batch/session
- items created
- warning/failure counts

## Export Strategy

Anki is the primary target, but export must always degrade cleanly.

### Primary targets

1. `Anki Package`
2. `Anki Text Bundle`
3. `Generic Text Bundle`

### Anki note types

#### `DialogLingo::Expression`

- `Front`
- `Back`
- `Gloss`
- `Context`
- `Explanation`
- `Quiz`
- `Tags`

#### `DialogLingo::Sentence`

- `Front`
- `Back`
- `Focus`
- `Explanation`
- `Quiz`
- `Tags`

### Export modal fields

- `Format`
- `Deck name`
- `Direction`
  - `EN -> ZH`
  - `ZH -> EN`
  - `Bilingual`
- `Include item types`
  - `Expression`
  - `Sentence`
- `Tag prefix`
- `Output location`

Do not add template-editing complexity in v1.

### Bundle contents

#### `Anki Text Bundle`

- `expression.tsv`
- `sentence.tsv`
- `README-import.md`
- `manifest.json`

#### `Generic Text Bundle`

- `expression.csv`
- `sentence.csv`
- `expression.md`
- `sentence.md`
- `manifest.json`

### Manifest

Every bundle should include `manifest.json` with:

- export time
- workbook id
- selected item count
- format
- language direction
- included item types
- tags
- source platform summary

## Privacy and Safety

Transcript privacy is a first-order requirement.

### Requirements

- local index by default
- explicit provider configuration before remote generation
- visible provenance from workbook item back to source session span
- transcript pre-cleaning before provider calls
- redaction and filtering policy for obvious sensitive noise
- no silent export of deleted or unreviewed workbook items

### Risk note

Coding-agent transcripts can contain:

- file paths
- repo names
- copied logs
- secret-like strings
- code and stack traces

The app must treat remote generation as deliberate, not invisible background syncing.

## Error Handling

### Source layer

- missing path
- unreadable local source
- malformed session payload
- hash mismatch between indexed and current content

Handle by:

- recording warning state
- preserving unaffected sessions
- showing source-level issue summaries

### Job layer

- partial batch failure
- provider timeout
- invalid structured payload
- LiteLLM request failure

Handle by:

- bounded retries
- partial-result persistence
- failed-batch counters
- resumable or restartable generation job state

### Export layer

- invalid output location
- failed package build
- unsupported field data

Handle by:

- fail export cleanly
- preserve workbook
- allow fallback to text-bundle export

## Testing Strategy

### Must-have tests

- per-source adapter fixture tests
- normalization tests across mixed-language turns
- denoising tests for code/log/path-heavy content
- candidate dedup tests
- ranking tests with deterministic fixtures
- workbook edit/delete/restore/revert tests
- export mapping tests

### Manual verification

- launch app on macOS/Windows/Linux
- auto-discover projects and sessions
- select sessions by default-open state
- generate workbook through LiteLLM
- edit/delete/restore items
- export Anki text bundle
- verify import into Anki

## v1 Scope Cut

To keep v1 sane:

- keep `Codex`, `Claude Code`, and `OpenCode` in the design
- but allow implementation staging if one adapter proves materially harder
- keep remote model access to `LiteLLM` only
- keep workbook item types to `Expression` and `Sentence`
- keep export targets to `Anki-first + text bundles`

The main value is not breadth. It is quality of the reviewed workbook loop.

## Acceptance Summary

DialogLingo v1 is successful if a user can:

1. open the app
2. see auto-discovered projects and sessions
3. filter and select sessions
4. generate a workbook from mixed-language AI conversations
5. review, edit, delete, restore, and revert workbook items
6. export to Anki-first formats
7. trust that the app preserved provenance and did not force them into an opaque black-box pipeline

