"use client";
import { useState } from "react";
import Link from "next/link";
import {
  filterYearLog,
  type ViewingLogEntry,
  type YearReview,
} from "../domain/year-review";
import { categoryEnglishLabel } from "@/modules/catalog/domain/title";
import { formatScore } from "@/modules/rankings/domain/score";
import { statusLabel } from "@/modules/watching/domain/watch-round";
import { formatDate } from "@/shared/lib/format-date";
import styles from "./year-review.module.css";

export function YearActivity({
  log,
  months,
}: {
  log: ViewingLogEntry[];
  months: YearReview["months"];
}) {
  const [month, setMonth] = useState<number | null>(null);
  const shown = filterYearLog(log, month),
    maximum = Math.max(1, ...months.map((item) => item.viewings));
  return (
    <section className={styles.activity}>
      <div className="sectionHeading">
        <div>
          <h2>Viewings, month by month.</h2>
          <p>
            A record of when your stories happened. Choose a month to open its
            viewing log.
          </p>
        </div>
        {month !== null && (
          <button className="quietButton" onClick={() => setMonth(null)}>
            All months
          </button>
        )}
      </div>
      <div
        className={styles.monthChart}
        role="group"
        aria-label="Monthly viewing activity"
      >
        {months.map((item) => (
          <button
            type="button"
            key={item.month}
            aria-pressed={month === item.month}
            onClick={() => setMonth(month === item.month ? null : item.month)}
            aria-label={`${item.name}: ${item.viewings} viewing records`}
          >
            <strong>{item.viewings}</strong>
            <span className={styles.barTrack} aria-hidden="true">
              <span
                style={{ transform: `scaleY(${item.viewings / maximum})` }}
              />
            </span>
            <small>{item.name.slice(0, 3)}</small>
          </button>
        ))}
      </div>
      <div className={styles.logHeading}>
        <h3>
          {month === null
            ? "The year’s viewing log"
            : `${months[month - 1]?.name} viewing log`}
        </h3>
        <span role="status">{shown.length} records</span>
      </div>
      <div className={styles.log}>
        {shown.map(({ title, round, date }) => (
          <article key={round.id} className={styles.logRow}>
            <time dateTime={date}>{formatDate(date, "en-GB")}</time>
            <div>
              <h4>
                <Link href={`/titles/${title.id}`}>{title.name}</Link>
              </h4>
              <p>
                {categoryEnglishLabel(title.category)} ·{" "}
                {statusLabel(round.status)}
                {title.isDemo ? " · Sample" : ""}
              </p>
              {round.note && <p className={styles.logNote}>{round.note}</p>}
            </div>
            <span>
              {formatScore(round.score)}
              <small>/ 10</small>
            </span>
          </article>
        ))}
      </div>
      {!shown.length && (
        <p className="emptyMessage">
          {month === null
            ? "No dated viewing records for this year yet."
            : "No viewing records for this month. Your other memories remain in the collection."}
        </p>
      )}
    </section>
  );
}
