import type { ArchiveEntry } from "./archive-entry";
import { installmentRounds, orderedInstallments, partViewings } from "./series";

export type LibraryEntry = ArchiveEntry & {
  storyId: string;
  partId: string | null;
};

/** Library ranks individual parts. These projections never replace the stored story or Hall entries. */
export function libraryEntries(
  entries: readonly ArchiveEntry[],
): LibraryEntry[] {
  return entries.flatMap((entry): LibraryEntry[] => {
    if (!entry.installments?.length)
      return [{ ...entry, storyId: entry.title.id, partId: null }];
    return orderedInstallments(entry).map((part) => ({
      storyId: entry.title.id,
      partId: part.id,
      title: {
        ...entry.title,
        id: part.id,
        name: `${entry.title.name} — ${part.name}`,
        originalTitle: part.originalTitle || entry.title.originalTitle,
        releaseYear: part.releaseYear ?? entry.title.releaseYear,
        coverUrl: part.coverUrl,
        backdropUrl: part.backdropUrl || entry.title.backdropUrl,
        synopsis: part.synopsis || entry.title.synopsis,
        totalEpisodes: part.totalEpisodes,
        runtimeMinutes: part.runtimeMinutes ?? entry.title.runtimeMinutes,
        viewingCount: partViewings(entry, part.id),
      },
      installments: [],
      rounds: installmentRounds(entry, part.id),
    }));
  });
}
