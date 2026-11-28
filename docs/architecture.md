# Architecture

This is a modular monolith: one Next.js application with modules grouped by the work they own. A module should hide meaningful rules behind a small interface. Files are split when responsibility changes, not to satisfy a line-count target.

| Area                       | Ownership                                                                        |
| -------------------------- | -------------------------------------------------------------------------------- |
| `app/`                     | Routes, server composition, metadata, loading and error states                   |
| `modules/catalog/`         | Media taxonomy, title validation, title records, pure library queries and editor |
| `modules/watching/`        | Viewing rounds, dates, status, progress, scores and notes                        |
| `modules/rankings/`        | Latest-round selection, score conversion, rank thresholds and tied rankings      |
| `modules/journal/`         | Chronological presentation of personal memories                                  |
| `infrastructure/database/` | SQLite connection and ordered transactional migrations                           |
| `shared/`                  | Reused presentation, formatting and form-result contracts                        |

`modules/insights/` owns pure annual aggregation, date attribution, per-category winners, monthly logs and duration coverage. `modules/backup/` owns snapshot validation, merge planning, inventory and transactional restore. Import delegates title/viewing persistence to their owning modules, preserving identities and timestamps.

Dependency flow: routes compose modules; server code calls pure domain functions and database infrastructure; domain code depends only on domain types and validation. Client components import serializable domain types, never database code. `server-only` protects server imports; ESLint enforces pure-domain imports.

SQLite stores titles and watch rounds separately with foreign keys. Scores are integer hundredths and derived from the newest round. There is no cached rank or duplicated current score. The database file lives in ignored `data/`, not the public directory. Migrations are versioned and applied in transactions. Nested mutations use SAVEPOINTs so an atomic import can call existing module operations safely. WAL and foreign-key checks are enabled.

The local app binds to loopback and has no authentication. Local SQLite must not be copied into an ephemeral/serverless filesystem and described as cloud persistence.

## Static ChatGPT Sites target

`src/site/` is a separate browser composition and persistence boundary. It reuses module UI and pure domain validation, ranking and analysis. `scripts/build-browser-site.mjs` explicitly maps Next navigation and the three UI action entry imports to browser adapters; no Next server runtime, SQL, or private records are bundled. The local Next routes and server entries continue to use SQLite. The static target uses hash routes so runtime title IDs and reloads work without a server fallback.

`BrowserArchive` stores one versioned JSON backup in localStorage. Mutations clone and validate the entire proposed archive before one atomic storage write; memory updates only after success. Imports preserve existing IDs and reject progress conflicts before committing. Web Locks serialize browser mutations across tabs; storage events reload other tabs. Invalid saved JSON is preserved for recovery, and quota errors leave the prior snapshot intact. JSON exports are compatible across both targets. Private access is enforced by the Sites platform, not custom app authentication. There is no cloud database or automatic synchronization; another device starts empty until the user imports JSON.

`README.md` describes commands, backup, demo content and verification. `PRODUCT.md` separates confirmed requirements from temporary product defaults.

## Installments and series organization

Catalog owns installments nested under an archive entry; watching rounds reference an optional installment identity. SQLite migration 2 adds the installment table and reference/source-note columns without changing previous migrations. The browser and SQLite targets validate ownership and per-part episode limits. Rank remains derived; no current score is persisted on a title or installment.

The pure catalog series domain selects each part's latest round, computes the equal story average and finds current progress without reviving an obsolete unfinished viewing. Annual rankings pass only that year's rounds into the same rules. Different seasons are not rewatches of one another.

Backup version 2 normalizes legacy exports. Ordinary merge preserves existing records. Reviewed series organization has explicit before/after snapshots: identity, title metadata, viewing dates and archived text are protected, and an exact before-state comparison rejects concurrent changes. The browser commits one validated snapshot; SQLite uses one transaction for every affected part and viewing. The original source text stays exportable but is not rendered as personal feelings.

Portable repair backups keep the ordinary version-2 entries and an optional reviewed organization manifest. The backup domain verifies that both contain the same normalized records. The UI chooses organization only when the current identity inventory matches the manifest's before-state; the mutation rechecks the complete before-state before any write. An empty or different collection receives the normal additive merge. This lets a supplied legacy archive gain its seasons in the user's actual browser without embedding personal records in the application bundle.

Library uses pure `libraryEntries` projections with an installment identity for ranking and a separate story identity for navigation. These projections never enter persistence or the Hall. Scores remain on viewing rounds.

The catalog domain owns manual viewing-count validation and a one-time legacy derivation. JSON normalization and SQLite migration 3 freeze earlier inferred counts; subsequent reviews cannot modify them. Version-2 backups remain readable and carry the extra optional metadata/count fields. A metadata-refresh import delegates to a pure catalog policy, then persists validated changes within the existing atomic browser write or SQLite transaction. The policy excludes personal fields and checks saved progress before any write.

## GitHub Pages deployment

The static build uses relative Vite asset URLs so one artifact supports a domain root or a project path. Browser composition provides the directory of the loaded page to `Artwork`; only stored `/images/` references receive that prefix at render time. Stored JSON, external image URLs and the local Next.js target retain their existing paths. CSS/font and HTML entrypoint URLs are rewritten by Vite.

`.github/workflows/pages.yml` checks and builds the static target, verifies compiled JavaScript/CSS/fonts/artwork over HTTP, and uploads only `dist/` to Pages. `scripts/check-static-site.mjs <url>` also checks the live deployment, rejecting uncompiled TypeScript, wrong MIME types and assets escaping the hosting path. Pages must use GitHub Actions as its publishing source. No personal archive is bundled or uploaded by this workflow.
