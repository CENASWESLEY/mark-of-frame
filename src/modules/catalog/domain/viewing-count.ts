import { z } from "zod";

export const viewingCountValueSchema = z.number().int().min(0).max(100000);

export const viewingCountSchema = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().pipe(viewingCountValueSchema).optional(),
);

/** One-time migration only: reviews stop controlling the count after this value is saved. */
export function legacyViewingCount(
  rounds: readonly { status: string; installmentId?: string | null }[],
  installmentIds: readonly string[] = [],
): number {
  const completed = rounds.filter((round) => round.status === "completed");
  if (!installmentIds.length) return completed.length;
  const overall = rounds.filter((round) => !round.installmentId);
  if (overall.length)
    return overall.filter((round) => round.status === "completed").length;
  return Math.min(
    ...installmentIds.map(
      (id) => completed.filter((round) => round.installmentId === id).length,
    ),
  );
}
