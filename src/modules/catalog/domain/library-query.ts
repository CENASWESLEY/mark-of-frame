import { z } from "zod";
import type { ArchiveEntry } from "./archive-entry";
import { categories } from "./title";
import {
  completedViewings,
  latestRound,
} from "@/modules/watching/domain/watch-round";
import { rankForScore } from "@/modules/rankings/domain/score";

export const librarySortSchema = z.enum([
  "score",
  "name",
  "viewings",
  "recent",
]);
export type LibrarySort = z.infer<typeof librarySortSchema>;

export type LibraryQuery = {
  search?: string;
  category?: string;
  genre?: string;
  country?: string;
  rank?: string;
  status?: string;
  /** Integer hundredths, identical to persisted scores. Null means no threshold. */
  minimumScore?: number | null;
  minimumViewings?: number | null;
  hideDemo?: boolean;
  sort?: LibrarySort;
};

export function libraryFacets(entries: readonly ArchiveEntry[]) {
  return {
    genres: [...new Set(entries.flatMap((entry) => entry.title.genres))].sort(
      (a, b) => a.localeCompare(b, "th"),
    ),
    countries: [
      ...new Set(entries.map((entry) => entry.title.country).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "th")),
  };
}

export function groupLibrary(
  entries: readonly ArchiveEntry[],
  query: LibraryQuery = {},
) {
  const results = queryLibrary(entries, query);
  return categories.map((category) => ({
    ...category,
    entries: results.filter((entry) => entry.title.category === category.id),
  }));
}

/** Search/filter/order policies are shared by callers and tests, independent of UI. */
export function queryLibrary(
  entries: readonly ArchiveEntry[],
  query: LibraryQuery = {},
): ArchiveEntry[] {
  const search = query.search?.trim().toLocaleLowerCase("th") ?? "";
  const summaries = entries.map((entry) => ({
    entry,
    latest: latestRound(entry.rounds),
    viewings: completedViewings(entry.rounds),
  }));
  const filtered = summaries.filter(({ entry, latest, viewings }) => {
    const { title } = entry;
    const score = latest?.score ?? null;
    const searchable = [
      title.name,
      title.originalTitle,
      title.genres.join(" "),
      title.country,
      title.language,
      title.releaseYear,
    ]
      .join(" ")
      .toLocaleLowerCase("th");
    return (
      (!search || searchable.includes(search)) &&
      (!query.category || title.category === query.category) &&
      (!query.genre || title.genres.includes(query.genre)) &&
      (!query.country || title.country === query.country) &&
      (!query.rank || rankForScore(score) === query.rank) &&
      (!query.status || (latest?.status ?? "planned") === query.status) &&
      (query.minimumScore == null ||
        (score !== null && score >= query.minimumScore)) &&
      (query.minimumViewings == null || viewings >= query.minimumViewings) &&
      (!query.hideDemo || !title.isDemo)
    );
  });
  filtered.sort((a, b) => {
    const byName =
      a.entry.title.name.localeCompare(b.entry.title.name, "th") ||
      a.entry.title.id.localeCompare(b.entry.title.id);
    if (query.sort === "name") return byName;
    if (query.sort === "viewings") return b.viewings - a.viewings || byName;
    if (query.sort === "recent")
      return (
        b.entry.title.createdAt.localeCompare(a.entry.title.createdAt) || byName
      );
    return (b.latest?.score ?? -1) - (a.latest?.score ?? -1) || byName;
  });
  return filtered.map(({ entry }) => entry);
}
