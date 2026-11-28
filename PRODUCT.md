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

- Confirmed rank thresholds: S >=9, A+ >=8.5, A >=8, B+ >=7.5, B >=7, C+ >=6, C >=5, D+ >=4, D below4. S is the ceiling; no S+.
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

- The latest home revision uses two desktop columns: details and compact Top 3 at left, featured cover at right, over a dark left-to-right gradient. The hero is capped at850px and uses the available viewport after the measured header. Long titles reserve two lines; slideshow controls retain their own bottom row. Narrow screens rearrange the cover beside the title and keep the remaining controls below. Category buttons use light italic Cormorant like the logo, a dark shadow and gold selection. Number badges are rounded. Empty categories are hidden; All-Time Ten posters and rows open title details.
- Collection poster cards share the tallest grid-item height across the current list; year/score and Edit details align despite different title lengths. List rows include a first column for the title's position within its own category, preserving ties. Unscored records display a dash. Filtering and sorting do not change the underlying category position.
- Editors and grouped controls are centered. Seasons/parts have explicit identities, ordered metadata, individual scores, progress and feelings. The series chain switches parts immediately; its active card has half opacity and scores/ranks appear inside the bottom of each card. Whole-story feelings remain separately editable.
- JSON version 2 includes installments and raw source notes; version 1 remains readable. Ordinary import remains additive. A separate reviewed organization file requires the exact original archive, preserves title/viewing identities and source text, and applies atomically. A stale archive is never overwritten.
- A portable corrected backup can include its reviewed organization plan. Settings chooses the exact repair for the original collection and additive import for a new or different collection, shows the number of seasons being added, and validates that both payloads contain the same records. Season cards sit directly after the viewing-count row in title details.

## ChatGPT Sites — confirmed 21 November 2026

The user wants this project available in their ChatGPT Sites library, using JSON export/import rather than a hosted database. Publish as a private static Site. Browser data is device/browser-local; never imply account-based sync. Keep the existing local Next.js/SQLite target and its data intact. Site creation starts with an empty archive; samples are labeled and explicitly opt-in.

## Confirmed revision — 23 November 2026

- Library expands series into separate ranked seasons/parts. Each card and list row shows its position within its category, using only that part's latest score. Standalone films and stories remain individual entries. Filters preserve the underlying category positions and ties. The Hall continues to rank whole stories by their existing overall scoring rule.
- Edit links from a season open only that season's form, with an explicit scope label and a separate whole-story editor. Season posters are independent: missing artwork shows a placeholder, never another season or whole-story poster. The Hall keeps the whole-story cover.
- Completed viewing counts are editable integers for a whole story and each installment, independent of review records. Legacy counts are copied once during JSON/SQLite migration; future review creation or editing never changes them. Explicit zero is preserved.
- Every review box offers its own edit action in a modal dialog; older reviews remain editable. A separate button opens a new memory. Review forms are never permanently expanded on the detail page.
- Home wheel/touch scrolling must reach the document from artwork and reading regions. A compact showcase may scroll internally on constrained screens, but its edges must allow normal document scroll chaining.
- JSON import can explicitly refresh title and season metadata: artwork, native names, release years, synopsis, genres, country/language, duration and episode totals. It preserves existing personal scores, viewing dates, feelings, identities and manual viewing counts. Conflicting episode limits reject the entire import atomically.

## Confirmed revision — 25 November 2026

- The All-Time Ten has a full-list modal for the selected category, showing up to ten whole-story rankings with complete title names, artwork, scores, ranks and viewing counts. Each entry opens its overall story details. The modal scrolls on smaller screens, closes with Escape or its close button, and suspends the background slideshow without changing the user's playback preference.

## Confirmed revision — 28 November 2026

- The existing static application also runs on GitHub Pages under `/mark-of-frame/`. GitHub Actions builds and publishes only `dist/`, never the raw TypeScript source. Relative build assets and a browser artwork prefix support both project subpaths and root-hosted Sites. Hash routes and JSON storage remain unchanged; Pages does not add authentication or synchronization.
