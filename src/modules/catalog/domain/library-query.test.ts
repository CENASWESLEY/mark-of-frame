import { describe, expect, it } from "vitest";
import { libraryFacets, queryLibrary } from "./library-query";
import type { ArchiveEntry } from "./archive-entry";
import type { Title } from "./title";
import type { WatchStatus } from "@/modules/watching/domain/watch-round";

function entry(
  name: string,
  scores: { score: number | null; date: string; status?: WatchStatus }[] = [],
  title: Partial<Title> = {},
): ArchiveEntry {
  return {
    title: {
      id: name,
      name,
      originalTitle: "",
      category: "film",
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
      ...title,
    },
    rounds: scores.map((score, index) => ({
      id: `${name}-${index}`,
      titleId: name,
      status: score.status ?? "completed",
      score: score.score,
      season: 1,
      episode: 0,
      startedOn: score.date,
      finishedOn: score.date,
      note: "",
      createdAt: score.date,
      updatedAt: score.date,
    })),
  };
}
const ids = (entries: ArchiveEntry[]) => entries.map((item) => item.title.id);

describe("library query contract", () => {
  const lowerLatest = () =>
    entry(
      "A",
      [
        { score: 990, date: "2024-01-01" },
        { score: 530, date: "2026-01-01" },
      ],
      { genres: ["Drama"], country: "ไทย" },
    );
  const higherLatest = () =>
    entry("B", [{ score: 865, date: "2026-01-01" }], {
      genres: ["Drama"],
      country: "Japan",
    });
  it("sorts and filters by the latest score instead of the historical maximum", () => {
    const entries = [lowerLatest(), higherLatest()];
    expect(ids(queryLibrary(entries))).toEqual(["B", "A"]);
    expect(ids(queryLibrary(entries, { minimumScore: 600 }))).toEqual(["B"]);
  });
  it("combines category, genre, country, rank, status and score conditions", () => {
    expect(
      ids(
        queryLibrary(
          [
            lowerLatest(),
            higherLatest(),
            entry("Anime", [{ score: 990, date: "2026-01-01" }], {
              category: "anime",
              genres: ["Drama"],
              country: "Japan",
            }),
          ],
          {
            category: "film",
            genre: "Drama",
            country: "Japan",
            rank: "A+",
            status: "completed",
            minimumScore: 800,
          },
        ),
      ),
    ).toEqual(["B"]);
  });
  it("does not reuse an old score when the latest round is unscored", () => {
    const item = entry("A", [
      { score: 990, date: "2024-01-01" },
      { score: null, date: "2026-01-01", status: "watching" },
    ]);
    expect(queryLibrary([item], { minimumScore: 0 })).toEqual([]);
    expect(ids(queryLibrary([item], { status: "watching" }))).toEqual(["A"]);
  });
  it("retains a genuine zero score with a zero-score minimum", () => {
    expect(
      ids(
        queryLibrary(
          [entry("Zero", [{ score: 0, date: "2026-01-01" }]), entry("Unrated")],
          { minimumScore: 0 },
        ),
      ),
    ).toEqual(["Zero"]);
  });
  it("treats a title without viewing rounds as planned", () => {
    expect(
      ids(
        queryLibrary([entry("Planned"), higherLatest()], { status: "planned" }),
      ),
    ).toEqual(["Planned"]);
  });
  it("counts only completed viewings for rewatch filters and sorting", () => {
    const a = entry("A", [
      { score: 900, date: "2024-01-01" },
      { score: null, date: "2026-01-01", status: "watching" },
    ]);
    const b = entry("B", [
      { score: 800, date: "2024-01-01" },
      { score: 800, date: "2025-01-01" },
    ]);
    expect(ids(queryLibrary([a, b], { minimumViewings: 2 }))).toEqual(["B"]);
    expect(ids(queryLibrary([a, b], { sort: "viewings" }))).toEqual(["B", "A"]);
  });
  it("hides samples without hiding personal records", () => {
    expect(
      ids(
        queryLibrary([entry("Demo", [], { isDemo: true }), entry("Mine")], {
          hideDemo: true,
        }),
      ),
    ).toEqual(["Mine"]);
  });
  it.each(["  ALTERNATEalpha  ", "หายาก", "ไทย", "ภาษาเฉพาะ", "1981"])(
    "searches metadata using %s",
    (search) => {
      const a = entry("A", [], {
        originalTitle: "AlternateAlpha",
        genres: ["หายาก"],
        country: "ไทย",
        language: "ภาษาเฉพาะ",
        releaseYear: 1981,
      });
      expect(ids(queryLibrary([a, entry("B")], { search }))).toEqual(["A"]);
    },
  );
  it("returns unique nonempty facets", () => {
    const facets = libraryFacets([
      lowerLatest(),
      higherLatest(),
      entry("C", [], { genres: ["Drama", "Fantasy"] }),
    ]);
    expect(facets.genres).toEqual(["Drama", "Fantasy"]);
    expect(facets.countries).toHaveLength(2);
    expect(facets.countries).toEqual(expect.arrayContaining(["ไทย", "Japan"]));
  });
  it("keeps source entries in their original order", () => {
    const entries = [lowerLatest(), higherLatest()];
    queryLibrary(entries, { sort: "score" });
    expect(ids(entries)).toEqual(["A", "B"]);
  });
});
