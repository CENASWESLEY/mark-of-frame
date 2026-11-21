import { z } from "zod";
import { scoreInputSchema } from "@/modules/rankings/domain/score";

export const watchStatuses = [
  { id: "planned", label: "อยากดู" },
  { id: "watching", label: "กำลังดู" },
  { id: "completed", label: "ดูจบ" },
  { id: "paused", label: "พักไว้" },
  { id: "dropped", label: "เลิกดู" },
] as const;
export type WatchStatus = (typeof watchStatuses)[number]["id"];
export const statusLabel = (id: WatchStatus) =>
  watchStatuses.find((status) => status.id === id)?.label ?? id;

const dateInput = z
  .string()
  .refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "วันที่ไม่ถูกต้อง")
  .transform((value) => value || null);

export const watchRoundInputSchema = z
  .object({
    titleId: z.string().uuid(),
    status: z.enum(watchStatuses.map((status) => status.id)),
    score: scoreInputSchema,
    season: z.coerce.number().int().min(1).max(1000),
    episode: z.coerce.number().int().min(0).max(100000),
    startedOn: dateInput,
    finishedOn: dateInput,
    note: z.string().trim().max(20000, "บันทึกได้สูงสุด 20,000 ตัวอักษร"),
  })
  .refine(
    (round) =>
      !round.startedOn ||
      !round.finishedOn ||
      round.startedOn <= round.finishedOn,
    { message: "วันที่ดูจบต้องไม่อยู่ก่อนวันเริ่มดู", path: ["finishedOn"] },
  );

export type WatchRoundInput = z.output<typeof watchRoundInputSchema>;
export type WatchRound = WatchRoundInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

/** Actual viewing dates take precedence, so backfilling an old round is safe. */
export function compareRoundsNewestFirst(a: WatchRound, b: WatchRound): number {
  const dateA = a.finishedOn ?? a.startedOn ?? a.createdAt.slice(0, 10);
  const dateB = b.finishedOn ?? b.startedOn ?? b.createdAt.slice(0, 10);
  return (
    dateB.localeCompare(dateA) ||
    b.createdAt.localeCompare(a.createdAt) ||
    b.id.localeCompare(a.id)
  );
}

export function latestRound(rounds: readonly WatchRound[]): WatchRound | null {
  return [...rounds].sort(compareRoundsNewestFirst)[0] ?? null;
}

export function completedViewings(rounds: readonly WatchRound[]): number {
  return rounds.filter((round) => round.status === "completed").length;
}

export function nextEpisode(current: number, total: number | null): number {
  return total === null ? current + 1 : Math.min(current + 1, total);
}
