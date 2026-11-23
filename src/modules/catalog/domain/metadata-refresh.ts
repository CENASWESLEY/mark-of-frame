import type { ArchiveEntry } from "./archive-entry";
import { isEpisodic } from "./title";

/** A metadata import can never overwrite feelings, scores, dates, identities or manual viewing counts. */
export function refreshCatalogMetadata(
  current: ArchiveEntry,
  incoming: ArchiveEntry,
): ArchiveEntry {
  if (current.title.id !== incoming.title.id)
    throw new Error("Metadata belongs to a different title.");
  const source = incoming.title;
  const title = {
    ...current.title,
    originalTitle: source.originalTitle || current.title.originalTitle,
    releaseYear: source.releaseYear ?? current.title.releaseYear,
    genres: source.genres.length ? source.genres : current.title.genres,
    country: source.country || current.title.country,
    language: source.language || current.title.language,
    coverUrl: source.coverUrl || current.title.coverUrl,
    backdropUrl: source.backdropUrl || current.title.backdropUrl,
    synopsis: source.synopsis || current.title.synopsis,
    runtimeMinutes: source.runtimeMinutes ?? current.title.runtimeMinutes,
    totalEpisodes: isEpisodic(current.title.category)
      ? (source.totalEpisodes ?? current.title.totalEpisodes)
      : null,
  };
  const installments = (current.installments ?? []).map((part) => {
    const next = incoming.installments?.find((item) => item.id === part.id);
    if (!next) return part;
    return {
      ...part,
      originalTitle: next.originalTitle || part.originalTitle,
      runtimeMinutes: next.runtimeMinutes ?? part.runtimeMinutes,
      releaseYear: next.releaseYear ?? part.releaseYear,
      coverUrl: next.coverUrl || part.coverUrl,
      backdropUrl: next.backdropUrl || part.backdropUrl,
      synopsis: next.synopsis || part.synopsis,
      totalEpisodes: next.totalEpisodes ?? part.totalEpisodes,
    };
  });
  for (const round of current.rounds) {
    const limit = round.installmentId
      ? installments.find((part) => part.id === round.installmentId)
          ?.totalEpisodes
      : title.totalEpisodes;
    if (limit != null && round.episode > limit)
      throw new Error(
        "Metadata episode total conflicts with saved progress. No data was changed.",
      );
  }
  return { ...current, title, installments };
}
