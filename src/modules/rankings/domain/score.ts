import { z } from "zod";

/** Scores are integer hundredths throughout the application and database. */
export const scoreInputSchema = z
  .string()
  .trim()
  .regex(
    /^(?:|10(?:\.0{1,2})?|[0-9](?:\.[0-9]{1,2})?)$/,
    "ให้คะแนน 0–10 และทศนิยมไม่เกิน 2 ตำแหน่ง",
  )
  .transform((value) =>
    value === "" ? null : Math.round(Number(value) * 100),
  );

export const rankThresholds = [
  { rank: "S", minimum: 900 },
  { rank: "A", minimum: 800 },
  { rank: "B", minimum: 700 },
  { rank: "C", minimum: 500 },
  { rank: "D", minimum: 0 },
] as const;

export type Rank = (typeof rankThresholds)[number]["rank"];

export function rankForScore(score: number | null): Rank | null {
  if (score === null) return null;
  if (!Number.isInteger(score) || score < 0 || score > 1000)
    throw new RangeError("Score must be integer hundredths between 0 and 1000");
  return (
    rankThresholds.find((threshold) => score >= threshold.minimum)?.rank ?? "D"
  );
}

export const formatScore = (score: number | null) =>
  score === null ? "—" : (score / 100).toFixed(2);
