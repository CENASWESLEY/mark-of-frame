import { describe, expect, it } from "vitest";
import { rankEntries } from "./rankings";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import { rankForScore, scoreInputSchema } from "./score";
import type { WatchRound } from "@/modules/watching/domain/watch-round";

const round = (
  score: number | null,
  date: string,
  createdAt = date,
): WatchRound => ({
  id: date,
  titleId: "title",
  status: "completed",
  score,
  season: 1,
  episode: 0,
  startedOn: date,
  finishedOn: date,
  note: "",
  createdAt,
  updatedAt: createdAt,
});
function entry(
  name: string,
  scores: WatchRound[],
  category: "film" | "anime" = "film",
): ArchiveEntry {
  return {
    title: {
      id: name,
      name,
      originalTitle: "",
      category,
      releaseYear: null,
      genres: [],
      country: "",
      language: "",
      coverUrl: "",
      backdropUrl: "",
      synopsis: "",
      runtimeMinutes: null,
      totalEpisodes: null,
      isDemo: false,
      createdAt: "2026-01-01",
    },
    rounds: scores,
  };
}

describe("personal rankings", () => {
  it("uses a lower latest score instead of maximum or average", () => {
    const result = rankEntries(
      [
        entry("A", [round(990, "2024-01-01"), round(530, "2026-01-01")]),
        entry("B", [round(865, "2026-01-01")]),
      ],
      "film",
    );
    expect(result.map((item) => [item.title.name, item.score])).toEqual([
      ["B", 865],
      ["A", 530],
    ]);
  });
  it("does not replace the latest watch with a backfilled old round", () => {
    const result = rankEntries(
      [
        entry("A", [
          round(990, "2024-01-01", "2026-11-21"),
          round(530, "2026-01-01", "2026-01-01"),
        ]),
      ],
      "film",
    );
    expect(result[0]?.score).toBe(530);
  });
  it("leaves a title unranked when its newest round is unscored", () => {
    expect(
      rankEntries(
        [entry("A", [round(990, "2024-01-01"), round(null, "2026-01-01")])],
        "film",
      ),
    ).toEqual([]);
  });
  it("separates media categories and retains zero scores", () => {
    const result = rankEntries(
      [
        entry("A", [round(0, "2026-01-01")]),
        entry("Anime", [round(1000, "2026-01-01")], "anime"),
      ],
      "film",
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.score).toBe(0);
    expect(result[0]?.rank).toBe("D");
  });
  it("gives tied scores the same rank with deterministic display ordering", () => {
    const result = rankEntries(
      [
        entry("B", [round(900, "2026-01-01")]),
        entry("A", [round(900, "2026-01-01")]),
        entry("C", [round(850, "2026-01-01")]),
      ],
      "film",
    );
    expect(result.map((item) => [item.title.name, item.position])).toEqual([
      ["A", 1],
      ["B", 1],
      ["C", 3],
    ]);
  });
});

describe("score input", () => {
  it.each([
    ["8.65", 865],
    ["5.3", 530],
    ["10.00", 1000],
    ["0", 0],
    ["", null],
  ])("parses %s into exact hundredths", (input, expected) => {
    expect(scoreInputSchema.parse(input)).toBe(expected);
  });
  it.each(["8.655", "10.01", "-1", "11", "NaN", "1e1"])("rejects %s", (input) =>
    expect(scoreInputSchema.safeParse(input).success).toBe(false),
  );
  it("derives rank at exact thresholds", () => {
    expect(rankForScore(899)).toBe("A");
    expect(rankForScore(900)).toBe("S");
    expect(rankForScore(null)).toBeNull();
  });
});
