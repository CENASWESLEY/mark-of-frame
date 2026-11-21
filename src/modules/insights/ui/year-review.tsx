import Link from "next/link";
import { Crown, Film, Repeat2 } from "lucide-react";
import type { YearReview as Review } from "../domain/year-review";
import { categoryEnglishLabel } from "@/modules/catalog/domain/title";
import { formatScore } from "@/modules/rankings/domain/score";
import { Artwork } from "@/shared/ui/artwork";
import { RankBadge } from "@/shared/ui/rank-badge";
import { YearActivity } from "./year-activity";
import styles from "./year-review.module.css";

export function YearReview({ review }: { review: Review }) {
  const active = review.categories.filter(
    (category) => category.titleCount > 0,
  );
  return (
    <div className={styles.review}>
      <div className={styles.yearNumber} aria-hidden="true">
        {review.year}
      </div>
      <div className={styles.stats}>
        <div>
          <strong>{review.titleCount}</strong>
          <span>Stories explored</span>
        </div>
        <div>
          <strong>{review.completedViewings}</strong>
          <span>Completed viewings</span>
        </div>
        <div>
          <strong>{review.rewatches}</strong>
          <span>Recorded rewatches</span>
        </div>
        <div>
          <strong>{review.categoriesExplored}</strong>
          <span>Categories explored</span>
        </div>
      </div>
      <p className={styles.basis}>
        Grouped by viewing dates, never release dates. A completed viewing uses
        its finish date; an unfinished viewing uses its start date. Undated
        records are not assigned to a year.
      </p>
      {review.titleCount > 0 ? (
        <>
          <section className={styles.narrative}>
            <div>
              <h2>What stayed with you.</h2>
              <p>
                You made room for {review.titleCount} different stories in{" "}
                {review.year}
                {review.rewatches
                  ? `, and returned for ${review.rewatches} recorded rewatches`
                  : ""}
                .{" "}
                {review.mostActiveMonth
                  ? `${review.mostActiveMonth.name} held the most viewing activity, with ${review.mostActiveMonth.viewings} records.`
                  : ""}{" "}
                {review.genres[0]
                  ? `“${review.genres[0].name}” appeared across ${review.genres[0].count} of the titles you explored.`
                  : ""}
              </p>
            </div>
            <div className={styles.runtime}>
              <Film size={20} aria-hidden="true" />
              <strong>
                {review.timedFilmViewings
                  ? `${Math.floor(review.knownFilmMinutes / 60)}h ${review.knownFilmMinutes % 60}m`
                  : "—"}
              </strong>
              <span>Recorded film time</span>
              <small>
                From {review.timedFilmViewings} completed non-episodic viewings
                with a known runtime. Episodic and missing durations are
                excluded.
              </small>
            </div>
          </section>
          <section className={styles.categorySection}>
            <div className="sectionHeading">
              <div>
                <h2>The finest of {review.year}.</h2>
                <p>
                  Each category has its own podium. Scores reflect the final
                  viewing recorded within this year, even if you felt
                  differently later.
                </p>
              </div>
              <Crown size={24} className="gold" aria-hidden="true" />
            </div>
            <div className={styles.categoryGrid}>
              {active.map((category) => (
                <section key={category.id} className={styles.category}>
                  <div className={styles.categoryHeading}>
                    <h3>{categoryEnglishLabel(category.id)}</h3>
                    <span>
                      {category.titleCount} titles · Avg{" "}
                      {formatScore(category.averageScore)}
                    </span>
                  </div>
                  {category.ranked.slice(0, 3).map((entry) => (
                    <Link
                      key={entry.title.id}
                      href={`/titles/${entry.title.id}`}
                      className={styles.winner}
                    >
                      <span className={styles.winnerPosition}>
                        {String(entry.position).padStart(2, "0")}
                      </span>
                      <span className={styles.winnerCover}>
                        <Artwork
                          src={entry.title.coverUrl}
                          title={entry.title.name}
                        />
                      </span>
                      <span className={styles.winnerName}>
                        {entry.title.name}
                        {entry.title.isDemo && <small>Sample collection</small>}
                      </span>
                      <RankBadge rank={entry.rank} size="small" />
                      <strong>{formatScore(entry.score)}</strong>
                    </Link>
                  ))}
                  {!category.ranked.length && (
                    <p className={styles.unrated}>
                      No score on the final viewing in this year. Memories still
                      count.
                    </p>
                  )}
                </section>
              ))}
            </div>
          </section>
          <div className={styles.tasteGrid}>
            <section>
              <h2>The shapes of your year.</h2>
              <p className="muted small">
                Genres counted once per title, including stories still in
                progress.
              </p>
              <ol className={styles.genreList}>
                {review.genres.slice(0, 5).map((genre) => (
                  <li key={genre.name}>
                    <span>{genre.name}</span>
                    <strong>{genre.count} titles</strong>
                  </li>
                ))}
              </ol>
              {!review.genres.length && (
                <p className="emptyMessage">
                  Add genres to your titles to see this part of your year.
                </p>
              )}
            </section>
            <section>
              <h2>The ranks you gave.</h2>
              <p className="muted small">
                One final score per title in this year. {review.unscoredTitles}{" "}
                titles remain unscored.
              </p>
              <div className={styles.rankDistribution}>
                {review.rankCounts.map((item) => (
                  <div key={item.rank}>
                    <RankBadge rank={item.rank} size="small" />
                    <span className={styles.rankTrack}>
                      <span
                        style={{
                          transform: `scaleX(${review.titleCount ? item.count / review.titleCount : 0})`,
                        }}
                      />
                    </span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="emptyState">
          <Repeat2 size={30} className="gold" aria-hidden="true" />
          <h2>This chapter is still unwritten.</h2>
          <p>
            No dated viewings belong to {review.year} yet. Add dates to a
            viewing or choose another year to revisit its stories.
          </p>
          <Link href="/manage" className="button">
            Manage your collection
          </Link>
        </div>
      )}
      <YearActivity key={review.year} log={review.log} months={review.months} />
      {review.undatedViewings > 0 && (
        <p className={styles.undated}>
          {review.undatedViewings} viewing records have no known date and are
          kept outside annual totals. They are still available in Library and
          Memories.
        </p>
      )}
    </div>
  );
}
