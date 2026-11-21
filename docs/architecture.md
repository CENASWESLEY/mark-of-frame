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
