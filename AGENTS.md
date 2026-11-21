# Afterframe engineering standards

- Read PRODUCT.md and docs/architecture.md before changing behavior.
- Preserve the approved Afterframe cinematic dark design in DESIGN.md.
- Organize code by business module; keep routes thin. Do not put business rules in JSX or SQL projection code.
- Domain code must not import Next.js, React, infrastructure, or UI.
- SQLite access belongs in infrastructure/database or module server code. Use parameterized statements and transactions for dependent writes.
- Keep every server entry marked with `server-only` or `use server`. Validate untrusted inputs with Zod on the server, even when HTML validates them.
- Represent scores as integer hundredths, 0–1000. Rank and ordering are derived; never persist duplicate scores or rank fields on titles.
- Use the latest watch round, never max or average. Preserve prior rounds. Missing latest score means unranked, never an automatic fallback.
- Public module contracts live in domain files and server entry files. Do not introduce pass-through service/repository/interface layers without a real need.
- Use strict TypeScript, no explicit any, no ts-ignore. Explain unusual choices with focused comments.
- Use existing design tokens and semantic controls. Hover information must also be available on the detail page; honor reduced motion.
- Add meaningful tests for scoring, watch-round ordering, validation, persistence, and multi-record mutations. Do not write tests that only mirror markup.
- Run typecheck, lint, tests, and build before handoff. Keep sample content explicitly labeled and separate from real records.
- This phase is a local, single-user app on 127.0.0.1. Do not deploy or claim authentication or cloud sync is implemented.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
