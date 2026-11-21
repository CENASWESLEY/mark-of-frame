import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import {
  categories,
  isEpisodic,
  type Title,
} from "@/modules/catalog/domain/title";
import {
  compareRoundsNewestFirst,
  latestRound,
  type WatchRound,
} from "@/modules/watching/domain/watch-round";
import { rankEntries } from "@/modules/rankings/domain/rankings";
import { rankThresholds } from "@/modules/rankings/domain/score";

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
export type ViewingLogEntry = { title: Title; round: WatchRound; date: string };
export const viewingDate = (round: WatchRound) =>
  round.status === "completed"
    ? (round.finishedOn ?? round.startedOn)
    : (round.startedOn ?? round.finishedOn);

export function availableReviewYears(
  entries: readonly ArchiveEntry[],
  currentYear: number,
): number[] {
  const years = new Set([currentYear]);
  for (const entry of entries)
    for (const round of entry.rounds) {
      const date = viewingDate(round);
      if (date && round.status !== "planned")
        years.add(Number(date.slice(0, 4)));
    }
  return [...years].sort((a, b) => b - a);
}

/** Historical scores are selected inside the year, never from a later rewatch. */
export function buildYearReview(
  archive: readonly ArchiveEntry[],
  year: number,
) {
  const entries: ArchiveEntry[] = [];
  const log: ViewingLogEntry[] = [];
  let undatedViewings = 0,
    rewatches = 0,
    knownFilmMinutes = 0,
    timedFilmViewings = 0;
  for (const entry of archive) {
    const rounds = entry.rounds.filter((round) => {
      if (round.status === "planned") return false;
      const date = viewingDate(round);
      if (!date) {
        undatedViewings++;
        return false;
      }
      return Number(date.slice(0, 4)) === year;
    });
    if (rounds.length) entries.push({ title: entry.title, rounds });
    for (const round of rounds) {
      const date = viewingDate(round);
      if (date) log.push({ title: entry.title, round, date });
      if (
        round.status === "completed" &&
        !isEpisodic(entry.title.category) &&
        entry.title.runtimeMinutes !== null
      ) {
        knownFilmMinutes += entry.title.runtimeMinutes;
        timedFilmViewings++;
      }
    }
    const completed = entry.rounds
      .filter((round) => round.status === "completed")
      .sort(compareRoundsNewestFirst)
      .reverse();
    rewatches += completed
      .slice(1)
      .filter(
        (round) => viewingDate(round)?.slice(0, 4) === String(year),
      ).length;
  }
  log.sort((a, b) => compareRoundsNewestFirst(a.round, b.round));
  const months = monthNames.map((name, index) => ({
    month: index + 1,
    name,
    viewings: log.filter((item) => Number(item.date.slice(5, 7)) === index + 1)
      .length,
    completed: log.filter(
      (item) =>
        Number(item.date.slice(5, 7)) === index + 1 &&
        item.round.status === "completed",
    ).length,
  }));
  const categoryReviews = categories.map((category) => {
    const categoryEntries = entries.filter(
      (entry) => entry.title.category === category.id,
    );
    const ranked = rankEntries(categoryEntries, category.id);
    const averageScore = ranked.length
      ? Math.round(
          ranked.reduce((sum, entry) => sum + entry.score, 0) / ranked.length,
        )
      : null;
    return {
      ...category,
      titleCount: categoryEntries.length,
      completedViewings: categoryEntries.reduce(
        (sum, entry) =>
          sum +
          entry.rounds.filter((round) => round.status === "completed").length,
        0,
      ),
      ranked,
      averageScore,
    };
  });
  const genreCounts = new Map<string, number>();
  for (const entry of entries)
    for (const genre of new Set(entry.title.genres))
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
  const genres = [...genreCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "th"));
  const rankCounts = rankThresholds.map(({ rank }) => ({
    rank,
    count: categoryReviews.reduce(
      (sum, category) =>
        sum + category.ranked.filter((entry) => entry.rank === rank).length,
      0,
    ),
  }));
  const mostActiveMonth = [...months].sort(
    (a, b) => b.viewings - a.viewings || a.month - b.month,
  )[0];
  return {
    year,
    entries,
    log,
    months,
    categories: categoryReviews,
    genres,
    rankCounts,
    titleCount: entries.length,
    completedViewings: log.filter((item) => item.round.status === "completed")
      .length,
    rewatches,
    categoriesExplored: categoryReviews.filter(
      (category) => category.titleCount > 0,
    ).length,
    knownFilmMinutes,
    timedFilmViewings,
    undatedViewings,
    mostActiveMonth: mostActiveMonth?.viewings ? mostActiveMonth : null,
    unscoredTitles: entries.filter(
      (entry) => latestRound(entry.rounds)?.score == null,
    ).length,
  };
}

export type YearReview = ReturnType<typeof buildYearReview>;
export function filterYearLog(
  log: readonly ViewingLogEntry[],
  month: number | null,
): ViewingLogEntry[] {
  return month === null
    ? [...log]
    : log.filter((item) => Number(item.date.slice(5, 7)) === month);
}
