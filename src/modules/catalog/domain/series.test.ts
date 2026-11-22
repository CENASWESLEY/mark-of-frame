import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { sampleBackup } from "@/site/sample";
import {
  activePart,
  currentViewing,
  entryScore,
  installmentRounds,
  orderedInstallments,
  progressLimit,
  storyViewings,
} from "./series";
import type { ArchiveEntry } from "./archive-entry";
import { buildYearReview } from "@/modules/insights/domain/year-review";

function fixture(): ArchiveEntry {
  const entry = structuredClone(sampleBackup().entries[0]!);
  entry.rounds = [];
  entry.installments = [2, 1, 3].map((position) => ({
    id: randomUUID(),
    titleId: entry.title.id,
    name: `Season ${position}`,
    position,
    releaseYear: 2020,
    coverUrl: "",
    backdropUrl: "",
    synopsis: "",
    totalEpisodes: 12,
  }));
  return entry;
}
function viewing(
  entry: ArchiveEntry,
  position: number,
  score: number | null,
  date = "2025-01-01",
  status: "completed" | "watching" = "completed",
) {
  const round = {
    id: randomUUID(),
    titleId: entry.title.id,
    installmentId: entry.installments!.find(
      (part) => part.position === position,
    )!.id,
    season: position,
    status,
    score,
    episode: 1,
    startedOn: date,
    finishedOn: null,
    note: "A feeling",
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
  entry.rounds.push(round);
  return round;
}
describe("series scoring and viewing scope", () => {
  it("averages the latest score per part, includes zero and excludes unrated parts", () => {
    const entry = fixture();
    viewing(entry, 1, 900);
    viewing(entry, 2, 0);
    expect(entryScore(entry)).toBe(450);
    viewing(entry, 1, 851, "2026-01-01");
    expect(entryScore(entry)).toBe(426);
  });
  it("does not recover an older score when a part has a newer unscored viewing", () => {
    const entry = fixture();
    viewing(entry, 1, 900);
    viewing(entry, 1, null, "2026-01-01");
    expect(entryScore(entry)).toBeNull();
  });
  it("ignores legacy overall scores after parts exist", () => {
    const entry = fixture();
    entry.rounds.push({
      ...viewing(entry, 1, 500),
      id: randomUUID(),
      installmentId: null,
      score: 1000,
    });
    expect(entryScore(entry)).toBe(500);
  });
  it("sorts parts and selects a safe default for invalid links", () => {
    const entry = fixture();
    expect(orderedInstallments(entry).map((part) => part.position)).toEqual([
      1, 2, 3,
    ]);
    expect(activePart(entry, "invalid")?.position).toBe(1);
    expect(activePart(entry, "overall")).toBeNull();
    expect(() => progressLimit(entry, randomUUID())).toThrow();
  });
  it("does not resurrect an unfinished round superseded by completion", () => {
    const entry = fixture();
    viewing(entry, 1, null, "2025-01-01", "watching");
    viewing(entry, 1, 800, "2026-01-01");
    viewing(entry, 2, null, "2026-01-02", "watching");
    expect(currentViewing(entry)?.season).toBe(2);
    expect(installmentRounds(entry, entry.installments![0]!.id)).toHaveLength(
      1,
    );
  });
  it("does not count different seasons as full-story rewatches", () => {
    const entry = fixture();
    viewing(entry, 1, 800);
    viewing(entry, 2, 900);
    viewing(entry, 3, 700);
    expect(storyViewings(entry)).toBe(1);
    const review = buildYearReview([entry], 2025);
    expect(review.rewatches).toBe(0);
    expect(
      review.categories.find((item) => item.id === entry.title.category)
        ?.ranked[0]?.score,
    ).toBe(800);
  });
});
