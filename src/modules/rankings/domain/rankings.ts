import type { Category } from "@/modules/catalog/domain/title";
import { entryScore } from "@/modules/catalog/domain/series";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import { rankForScore, type Rank } from "./score";

export type RankedEntry = ArchiveEntry & {
  score: number;
  rank: Rank;
  position: number;
};

export function rankEntries(
  entries: readonly ArchiveEntry[],
  category: Category,
): RankedEntry[] {
  const scored = entries
    .flatMap((entry) => {
      if (entry.title.category !== category) return [];
      const score = entryScore(entry);
      const rank = rankForScore(score);
      return score === null || rank === null ? [] : [{ ...entry, score, rank }];
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.title.name.localeCompare(b.title.name, "th") ||
        a.title.id.localeCompare(b.title.id),
    );

  let position = 0;
  return scored.map((entry, index) => {
    if (index === 0 || entry.score !== scored[index - 1]?.score)
      position = index + 1;
    return { ...entry, position };
  });
}
