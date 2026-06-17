# Repository Guidelines

## Project Structure & Module Organization

DialogLingo is an Electron + React desktop app for turning local agent chat sessions into English learning material. Main-process services live in `src/main`: `db`, `scan`, `sources`, `generation`, `search`, `export`, `settings`, and `workbook`. The preload bridge is `src/preload`. Renderer UI is in `src/renderer/src`, with `src/renderer/index.html` and `styles.css`. Shared IPC contracts, navigation IDs, and Zod schemas go in `src/shared`. Tests mirror domains under `tests/main`, `tests/renderer`, and `tests/shared`; fixtures live in `tests/fixtures`. Do not commit `dist-electron`, `out`, `dialoglingo.db`, or `*.tsbuildinfo`.

## Documentation Authority

Use `README.md` and this file for quick project onboarding and operational commands. Treat `docs/superpowers/specs/2026-06-15-dialoglingo-v1-design.md` as the current product and architecture contract, including its current implementation snapshot and known gaps. Treat `docs/ui/*` and `docs/superpowers/plans/*` as historical design and implementation references unless the v1 spec explicitly adopts them. When docs disagree with live code, verify the current code path first and update the v1 spec instead of copying old plan details forward.

## Build, Test, and Development Commands

- `npm install`: installs dependencies and runs native `better-sqlite3` hooks.
- `npm run dev`: prepares Electron bindings and starts Electron Vite.
- `npm run dev:mock-llm`: exercises the workbook UI with deterministic mock generation.
- `npm run build` / `npm run preview`: builds and previews the Electron app.
- `npm run typecheck`: runs strict TypeScript checks for node and web configs.
- `npm test` / `npm run test:watch`: runs Vitest once or in watch mode.
- `npm run db:migrate`: applies Drizzle SQLite migrations to `dialoglingo.db`.

If Node tests hit `NODE_MODULE_VERSION` after an Electron build, run `npm run rebuild:native:node` and `npm run capture:native:node`.

## Coding Style & Naming Conventions

Use TypeScript ESM, strict types, two-space indentation, single quotes, and no semicolons. Prefer named exports for services and helpers. React components use `PascalCase`, hooks use `useCamelCase`, and tests use `*.test.ts`. Put shared schemas/types in `src/shared` instead of duplicating them across main and renderer code. Keep source adapters thin and explicit.

## Testing Guidelines

Vitest runs in a Node environment with globals enabled. Add focused tests in the closest domain folder, for example `tests/main/search/query-sessions.test.ts` or `tests/renderer/ui-state.test.ts`. Use `tests/main/testDb.ts` for database-backed tests and `tests/fixtures` for stable transcript samples. Run `npm run typecheck` and `npm test` before handing off behavior changes.

## Commit & Pull Request Guidelines

Recent history uses short imperative subjects, often with `feat:`, `fix:`, `docs:`, or `perf:` prefixes. Keep subjects specific, for example `fix: strengthen session search matching`. Pull requests should describe the affected workflow, list verification commands, link any issue or spec, and include screenshots or clips for renderer UI changes. Call out migrations, native-module changes, and sensitive generation behavior.

## Security & Configuration Tips

Do not commit local databases, API keys, generated exports, or transcript dumps. Remote generation should respect redaction settings, and mock generation should stay opt-in.
