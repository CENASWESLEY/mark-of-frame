# Mark of Frame

A personal entertainment hall, viewing journal and annual review. Internal package/database names retain `afterframe` for compatibility with the first version.

## Run locally

Requires Node.js 24 and pnpm. SQLite is included with Node; no database server or account is required.

```powershell
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000. The database is created automatically at `data/afterframe.sqlite`. To use a different path, copy `.env.example` to `.env.local` and set `AFTERFRAME_DATABASE_PATH`.

## Demo collection

```powershell
pnpm db:seed
```

This opt-in command adds clearly labeled sample titles and viewing rounds. It is idempotent and does not replace real entries. In the library, “ซ่อนข้อมูลตัวอย่าง” hides samples. The development preview in this chat uses a separate ignored demonstration database.

## Implemented

- Full-width five-second featured slideshow, Top 3 overlays, centered dimensional Hall heading, faint mist and automatic game-style D–S ranks. Pause/resume and reduced motion are supported.
- Category-specific Top 10 with poster/list view switching.
- Library search, category/genre/country/rank/status/score/viewing filters and ordering.
- Title create/edit, cover/backdrop URLs, metadata and synopsis.
- Dated viewing rounds, separate scores and feelings, latest-round editing, rewatch history and episode progress.
- Chronological memory journal and annual viewing analysis: per-category winners/averages, monthly logs, rewatches, genres and known film runtime.
- Grouped management with the title editor inside Manage; direct editing remains available in Library.
- Settings with JSON export, validated import preview and non-destructive atomic merge.
- Durable local SQLite, versioned migrations, input validation, strict TypeScript and module rules.

Scores use the newest round only. Unknown latest scores remain unranked. Rank thresholds, season-level scoring and unfinished-round behavior are provisional; see `PRODUCT.md`.

## Project structure

Read `docs/architecture.md`, `AGENTS.md`, `PRODUCT.md` and `DESIGN.md`. `src/app` composes feature modules; domain rules stay independent of React, Next and storage.

## Checks

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

## Data and backup

Settings downloads all title metadata and complete watch history as a version-one JSON document. Import accepts both original and current version-one exports, up to 8 MB. Preview shows new and existing records before submission. Records merge by identity: existing titles and viewings are never overwritten or deleted; if any record conflicts with saved progress limits, the whole import rolls back. Artwork links are preserved, but image binaries are not embedded.

For a raw restorable SQLite backup, stop the app and copy the entire ignored `data/` directory, including any WAL/SHM files. Never copy only a live SQLite main file while the app is writing.

The local Next.js target is single-user and binds only to 127.0.0.1. Its SQLite records are not uploaded to Sites.

## ChatGPT Sites

The private Site is **MARK OF FRAME — Entertainment Archive**. It uses the same interface and domain rules, with browser-local JSON storage. Settings exports/imports the same version-one JSON backups as the local app. Records do not sync with a ChatGPT account: import the backup when moving devices, and export regularly before clearing browser data. The first visit is empty; labeled sample content is opt-in.

`pnpm build:site` produces the static `dist/` target. `pnpm build:local` builds Next.js only; `pnpm build` verifies and builds both. `src/site/` owns browser persistence, navigation and action adapters; feature modules retain their existing UI and pure domains. `.openai/hosting.json` records the private Site identity. Publishing through Sites preserves the full source project while uploading only static build assets.

## Assets

Demo artwork originates from TMDB image assets used in the approved concept; see `public/images/sources.json`. User-added cover URLs are fetched directly by the browser and have a fallback. Fonts are self-hosted Cormorant Garamond, Noto Sans Thai and Racing Sans One under the SIL Open Font License; licenses are in `public/fonts/`.

## Annual review rules

Years refer to viewing dates, not release dates. Completed viewings use their finish date when known; unfinished viewings use their start date. Undated records are counted separately and are not assigned to an invented year. Annual rankings use the last round inside the selected year; the main Hall still uses the latest round overall. Scores and averages stay separate by category. Runtime totals include completed non-episodic viewings with a known duration and explicitly exclude unknown or episodic durations.
