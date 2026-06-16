# DialogLingo

DialogLingo turns agent chat sessions into structured English learning material.

Initial scope:
- Ingest local chat sessions from tools like Codex, Claude Code, and OpenCode.
- Generate reviewable `Expression` and `Sentence` workbook items from mixed-language agent conversations.
- Export study-ready material primarily to Anki, with text-bundle fallbacks for downstream tools.

## Native module ABI note

`better-sqlite3` has separate Node and Electron ABI builds in this repo.

- `npm run build` and `npm run dev` run `prepare:native:electron`, which rebuilds the Electron ABI copy used by the Electron main process.
- Vitest and other plain Node commands need the Node ABI copy.
- If a Node test fails with `NODE_MODULE_VERSION` after a build, refresh the Node ABI and snapshot before testing:

```bash
npm run rebuild:native:node
npm run capture:native:node
npm run test -- --run
```

Do not remove the Electron rebuild step. The detailed policy lives in `docs/architecture/2026-06-15-electron-stack-version-decision.md`.
