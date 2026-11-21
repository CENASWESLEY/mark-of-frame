# Verification

First implementation, 21 November 2026. All browser writes used the ignored `.verification/demo.sqlite` database, never the default personal database. The single temporary browser-test title was removed by its exact id and verified name after checking it.

## Automated tests

43 tests pass across ranking/score rules, pure library queries and SQLite integration.

Domain and SQLite integration tests cover latest-score ordering, lower rewatch scores, historical backfills, unknown scores, category isolation, ties, exact decimal input, rank thresholds, database reopen/migration idempotency, distinct viewing notes, editing without duplicate rounds, cross-title edit rejection, progress bounds and transactions, invalid dates and title edits that would invalidate recorded progress.

## Browser checks

- Created a title and saved a first round at 9.99, followed by a new round at 5.30.
- Reloaded the page and verified both scores and notes remained in SQLite and JSON export.
- Added a backdated 10.00 round and verified the current verdict stayed C / 5.30.
- Edited the latest round without adding another round.
- Submitted an invalid three-decimal score and verified the note stayed in the form while validation errors appeared.
- Edited title metadata and combined genre and minimum-score filters.
- Changed featured titles, expanded Top 5 to Top 10 and incremented episode progress.
- Verified unknown episode totals show the actual episode count and explanatory text, with no fabricated completion bar; incrementing still works.
- Checked horizontal overflow at 1440px, 390px and 320px, including the detail/editor page.
- Captured desktop/mobile views and checked browser runtime errors.

The seed script was run twice: 21 new labeled demo titles on the first run, zero on the second. The styling detector returned no findings on the principal theme, shell, Hall of Fame and poster styles.

The finish review identified and corrected the featured-label contrast, unknown-total completion display, and library query placement. Search/filter/sort policies now have a pure domain contract and their own tests.

These checks verify the first local version. Login, cloud synchronization, JSON import, season-specific rankings, partial-year dates and automated metadata lookup are outside this implementation.
