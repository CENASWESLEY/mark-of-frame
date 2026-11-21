import { describe, expect, it } from "vitest";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import type { Title } from "@/modules/catalog/domain/title";
import type { WatchRound } from "@/modules/watching/domain/watch-round";
import {
  availableReviewYears,
  buildYearReview,
  filterYearLog,
} from "./year-review";

function entry(
  name: string,
  rounds: Partial<WatchRound>[],
  overrides: Partial<Title> = {},
): ArchiveEntry {
  return {
    title: {
      id: name,
      name,
      originalTitle: "",
      category: "film",
      releaseYear: 1999,
      genres: [],
      country: "",
      language: "",
      coverUrl: "",
      backdropUrl: "",
      synopsis: "",
      runtimeMinutes: null,
      totalEpisodes: null,
      isDemo: false,
      createdAt: "2026-11-21T00:00:00.000Z",
      ...overrides,
    },
    rounds: rounds.map((round, index) => ({
      id: `${name}-${index}`,
      titleId: name,
      status: "completed",
      score: 900,
      season: 1,
      episode: 0,
      startedOn: null,
      finishedOn: null,
      note: "",
      createdAt: `2026-11-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      updatedAt: "2026-11-21T00:00:00.000Z",
      ...round,
    })),
  };
}

describe("annual viewing analysis", () => {
  it("prioritizes the start date while a viewing is unfinished", () => {
    const archive = [
      entry("In progress", [
        {
          status: "watching",
          startedOn: "2025-12-30",
          finishedOn: "2026-01-02",
        },
      ]),
    ];
    expect(buildYearReview(archive, 2025).titleCount).toBe(1);
    expect(buildYearReview(archive, 2026).titleCount).toBe(0);
  });
  it("uses viewing dates rather than release years", () => {
    const review = buildYearReview(
      [entry("A", [{ finishedOn: "2026-01-01" }], { releaseYear: 1980 })],
      2026,
    );
    expect(review.titleCount).toBe(1);
    expect(buildYearReview(review.entries, 1980).titleCount).toBe(0);
  });
  it("selects the final score inside the requested year, not a future rewatch", () => {
    const archive = [
      entry("A", [
        { finishedOn: "2024-01-01", score: 980 },
        { finishedOn: "2026-01-01", score: 530 },
        { finishedOn: "2027-01-01", score: 1000 },
      ]),
    ];
    expect(
      buildYearReview(archive, 2026).categories.find(
        (item) => item.id === "film",
      )?.ranked[0]?.score,
    ).toBe(530);
    expect(
      buildYearReview(archive, 2024).categories.find(
        (item) => item.id === "film",
      )?.ranked[0]?.score,
    ).toBe(980);
  });
  it("does not substitute an old score for an unscored final viewing in the year", () => {
    const review = buildYearReview(
      [
        entry("A", [
          { finishedOn: "2026-01-01", score: 900 },
          { startedOn: "2026-11-01", score: null, status: "watching" },
        ]),
      ],
      2026,
    );
    expect(
      review.categories.find((item) => item.id === "film")?.ranked,
    ).toEqual([]);
    expect(review.unscoredTitles).toBe(1);
  });
  it("keeps averages and winners separate by category and counts one score per title", () => {
    const review = buildYearReview(
      [
        entry("Film A", [
          { finishedOn: "2026-01-01", score: 1000 },
          { finishedOn: "2026-02-01", score: 900 },
        ]),
        entry("Film B", [{ finishedOn: "2026-01-01", score: 500 }]),
        entry("Anime", [{ finishedOn: "2026-01-01", score: 1000 }], {
          category: "anime",
        }),
      ],
      2026,
    );
    expect(
      review.categories.find((item) => item.id === "film")?.averageScore,
    ).toBe(700);
    expect(
      review.categories.find((item) => item.id === "anime")?.averageScore,
    ).toBe(1000);
    expect(review.categoriesExplored).toBe(2);
  });
  it("uses the finish date for completed cross-year viewings and start date for unfinished viewings", () => {
    const archive = [
      entry("Finished", [
        { startedOn: "2025-12-20", finishedOn: "2026-01-02" },
      ]),
      entry("Watching", [
        { startedOn: "2025-12-30", status: "watching", score: null },
      ]),
    ];
    expect(
      buildYearReview(archive, 2026).entries.map((item) => item.title.id),
    ).toEqual(["Finished"]);
    expect(
      buildYearReview(archive, 2025).entries.map((item) => item.title.id),
    ).toEqual(["Watching"]);
  });
  it("does not invent a viewing year from record creation timestamps", () => {
    const review = buildYearReview([entry("Undated", [{}])], 2026);
    expect(review.titleCount).toBe(0);
    expect(review.undatedViewings).toBe(1);
    expect(review.log).toEqual([]);
  });
  it("excludes planned entries even when they have dates", () => {
    const archive = [
      entry("Planned", [{ startedOn: "2020-01-01", status: "planned" }]),
    ];
    expect(buildYearReview(archive, 2020).titleCount).toBe(0);
    expect(availableReviewYears(archive, 2026)).toEqual([2026]);
  });
  it("counts a recorded rewatch across years and excludes an unfinished new round", () => {
    const archive = [
      entry("A", [
        { finishedOn: "2024-01-01" },
        { finishedOn: "2026-01-01" },
        { startedOn: "2026-11-01", status: "watching", score: null },
      ]),
    ];
    expect(buildYearReview(archive, 2026).rewatches).toBe(1);
    expect(buildYearReview(archive, 2024).rewatches).toBe(0);
    expect(buildYearReview(archive, 2026).completedViewings).toBe(1);
  });
  it("estimates film time only from completed non-episodic viewings with known runtime", () => {
    const archive = [
      entry(
        "Film",
        [
          { finishedOn: "2026-01-01" },
          { finishedOn: "2026-02-01" },
          { startedOn: "2026-03-01", status: "watching" },
        ],
        { runtimeMinutes: 60 },
      ),
      entry("Series", [{ finishedOn: "2026-01-01", episode: 10 }], {
        category: "series",
        runtimeMinutes: 24,
      }),
      entry("Unknown", [{ finishedOn: "2026-01-01" }]),
    ];
    const review = buildYearReview(archive, 2026);
    expect(review.knownFilmMinutes).toBe(120);
    expect(review.timedFilmViewings).toBe(2);
  });
  it("counts genres once per title rather than once per rewatch", () => {
    const review = buildYearReview(
      [
        entry(
          "A",
          [{ finishedOn: "2026-01-01" }, { finishedOn: "2026-11-01" }],
          { genres: ["Drama", "Drama"] },
        ),
        entry("B", [{ finishedOn: "2026-01-01" }], { genres: ["Drama"] }),
      ],
      2026,
    );
    expect(review.genres).toEqual([{ name: "Drama", count: 2 }]);
  });
  it("builds real monthly activity and allows log drilldown", () => {
    const review = buildYearReview(
      [
        entry("A", [
          { finishedOn: "2026-01-01" },
          { finishedOn: "2026-11-01" },
        ]),
        entry("B", [{ startedOn: "2026-11-02", status: "watching" }]),
      ],
      2026,
    );
    expect(review.mostActiveMonth?.name).toBe("November");
    expect(review.months[10]?.viewings).toBe(2);
    expect(filterYearLog(review.log, 11)).toHaveLength(2);
    expect(filterYearLog(review.log, null)).toHaveLength(3);
  });
  it("offers dated years plus the current year without adding release years or undated records", () => {
    expect(
      availableReviewYears(
        [
          entry(
            "A",
            [{ finishedOn: "2022-01-01" }, { finishedOn: "2024-01-01" }, {}],
            { releaseYear: 1900 },
          ),
        ],
        2026,
      ),
    ).toEqual([2026, 2024, 2022]);
  });
  it("represents an empty year honestly", () => {
    const review = buildYearReview([], 2026);
    expect(review.titleCount).toBe(0);
    expect(review.mostActiveMonth).toBeNull();
    expect(review.knownFilmMinutes).toBe(0);
    expect(review.months.every((item) => item.viewings === 0)).toBe(true);
  });
});
