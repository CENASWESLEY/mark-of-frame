import type { ArchiveEntry } from "./archive-entry";
import {
  latestRound,
  completedViewings,
  type WatchRound,
} from "@/modules/watching/domain/watch-round";
export function orderedInstallments(entry: ArchiveEntry) {
  return [...(entry.installments ?? [])].sort(
    (a, b) => a.position - b.position || a.id.localeCompare(b.id),
  );
}
export function installmentRounds(
  entry: ArchiveEntry,
  id: string | null = null,
) {
  return entry.rounds.filter((round) => (round.installmentId ?? null) === id);
}
/** Series average uses each part's latest score; a newer unscored round never falls back. */
export function entryScore(
  entry: ArchiveEntry,
  rounds: readonly WatchRound[] = entry.rounds,
): number | null {
  if (!entry.installments?.length) return latestRound(rounds)?.score ?? null;
  const scores = entry.installments.flatMap((part) => {
    const score = latestRound(
      rounds.filter((round) => round.installmentId === part.id),
    )?.score;
    return score == null ? [] : [score];
  });
  return scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
}
export function progressLimit(
  entry: ArchiveEntry,
  installmentId?: string | null,
) {
  if (!installmentId) return entry.title.totalEpisodes;
  const part = entry.installments?.find((part) => part.id === installmentId);
  if (!part) throw new Error("ไม่พบซีซัน/ภาคของเรื่องนี้");
  return part.totalEpisodes;
}
export function activePart(entry: ArchiveEntry, id?: string | null) {
  if (id === "overall") return null;
  return (
    orderedInstallments(entry).find((part) => part.id === id) ??
    orderedInstallments(entry)[0] ??
    null
  );
}
/** Only a part's latest round can be in progress; an old unfinished round is history. */
export function currentViewing(entry: ArchiveEntry) {
  const groups = [null, ...(entry.installments ?? []).map((part) => part.id)];
  return latestRound(
    groups.flatMap((id) => {
      const round = latestRound(installmentRounds(entry, id));
      return round?.status === "watching" ? [round] : [];
    }),
  );
}
export function storyViewings(entry: ArchiveEntry): number {
  if (!entry.installments?.length) return completedViewings(entry.rounds);
  const overall = installmentRounds(entry);
  if (overall.length) return completedViewings(overall);
  return Math.min(
    ...entry.installments.map((part) =>
      completedViewings(installmentRounds(entry, part.id)),
    ),
  );
}
