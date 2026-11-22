# Mark of Frame

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, TypeScript strict, React, CSS Modules, Zod. The local target uses Node 24 SQLite. The private ChatGPT Sites target reuses the UI and domains as a static browser app, storing validated JSON locally with manual export/import.

## Users and purpose

A personal archive for a Thai-speaking viewer of films, series, anime and animated films. Preserve feelings from each viewing and present a cinematic personal Hall of Fame.

## Confirmed rules

- Separate rankings by media format. Genres, countries, languages and release year are metadata and filters, not separate ranking categories.
- Top 5 and Top 10 are derived from the latest watch round's score only, out of 10, with up to two decimal places.
- Rank D–S is derived from the same score, not selected manually.
- Preserve dated notes and scores for each watch round; rewatching never overwrites an earlier round.
- Purple stars represent viewing counts. Keep progress for episodic media.
- The approved visual reference is the Afterframe mockup from this chat: dark cinema imagery, off-white type, restrained gold, burgundy progress accents, purple rewatch markers.
- Code quality, explicit module ownership, documented standards and testable domain logic are requirements.

## First implementation

Local durable SQLite storage, cinematic Hall of Frame, searchable/filterable library with poster/list views, grouped management and title editor, dated viewing rounds and latest-round edits, progress updates, memories, annual analysis, JSON backup export and reviewed non-destructive import. Demonstration data is opt-in through a seed command and visibly labeled.

## Open decisions and temporary defaults

- Rank thresholds are not yet confirmed. Initial configurable thresholds: S >=9, A >=8, B >=7, C >=5, D below5.
- Multi-part stories keep separate installments and viewing rounds. The Hall remains one story per entry, with an equal average of the latest scored round of each installment. A newer unscored round excludes that installment; explicit zero participates. Unwatched parts have no score.
- Scoring unfinished rounds is not yet confirmed. First version permits it; if the newest round has no score, the title is unranked until scored. This respects latest-round-only without silently reusing old scores.
- Ties receive the same rank; a stable title-name order decides display position when a Top 5/10 cut falls inside a tie. No rewatch-count tiebreak.
- Initial taxonomy: live-action film, live-action series, anime series, anime film, other animated film, other animated series, documentary film, documentary series, short film. Expand through one category definition.
- Dates may be unknown. A round's effective date uses its known finish/start date, otherwise creation time; creation time and id break ties. Partial-year date entry is future work.
- Cloud sync, automatic metadata lookup and image-file uploads are future work. Private Site access is managed by ChatGPT Sites; archive records remain in the browser.

## Confirmed revision — 21 November 2026

- Text-only logo: `Entertaiment` above `MARK OF FRAME`, preserving the user's supplied spelling.
- Large full-width, centered featured image; medium categories at top center; Top 3 compact cards over the image; auto-advance every five seconds with pause/play and reduced-motion support.
- Centered Hall of Frame heading below the image, gold/black depth, gradient and glow; faint animated mist on this experience surface.
- Italic dimensional game-style rank letters; gold, white, burgundy and purple retain their established roles.
- All-Time Ten always shows up to ten ranked titles, with poster/list views and separate category controls.
- Library offers full-width list rows, with details at left and rank/score at right; editing remains available there. The 22 November follow-up makes the smaller poster grid the default and moves search, sort and filters into a collapsible sidebar.
- Manage shows all category groups on one page, including the add-title editor. The former /titles/new URL redirects into Manage.
- Headings and descriptions are English; personal notes, metadata and existing Thai input labels remain intact.
- Annual analysis uses actual viewing dates, never release dates. Annual rankings use the final viewing inside the selected year; all-time rankings retain the final viewing overall. Averages and winners stay separate by category. Unknown dates and durations are explicitly excluded from applicable totals.
- Settings offers full JSON export, validated import preview and atomic merge. Existing identities are never deleted or overwritten. File backups preserve links to artwork, not image binaries.
- Collection cards, list rows and the featured Hall preview show a short synopsis. Detail history and memories show personal feelings only. Original technical import text is preserved in JSON source-note fields, never used as preview fallbacks. Missing synopses have an explicit empty state.

## Confirmed revision — 22 November 2026

- The home podium uses compact posters beneath Open my memory, as revised in the latest follow-up. Category buttons use self-hosted Caveat handwriting with a dark text shadow, a gold selected state and no rectangular background. Empty categories are hidden; All-Time Ten posters and rows open title details.
- Editors and grouped controls are centered. Seasons/parts have explicit identities, ordered metadata, individual scores, progress and feelings. The series chain switches parts immediately; its active card has half opacity and scores/ranks appear inside the bottom of each card. Whole-story feelings remain separately editable.
- JSON version 2 includes installments and raw source notes; version 1 remains readable. Ordinary import remains additive. A separate reviewed organization file requires the exact original archive, preserves title/viewing identities and source text, and applies atomically. A stale archive is never overwritten.
- A portable corrected backup can include its reviewed organization plan. Settings chooses the exact repair for the original collection and additive import for a new or different collection, shows the number of seasons being added, and validates that both payloads contain the same records. Season cards sit directly after the viewing-count row in title details.

## ChatGPT Sites — confirmed 21 November 2026

The user wants this project available in their ChatGPT Sites library, using JSON export/import rather than a hosted database. Publish as a private static Site. Browser data is device/browser-local; never imply account-based sync. Keep the existing local Next.js/SQLite target and its data intact. Site creation starts with an empty archive; samples are labeled and explicitly opt-in.
