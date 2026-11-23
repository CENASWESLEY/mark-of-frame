import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { sampleBackup } from "@/site/sample";
import { libraryEntries } from "./library-entries";
import { queryLibrary } from "./library-query";
import {
  rankEntries,
  categoryPositions,
} from "@/modules/rankings/domain/rankings";

describe("Library installment rankings", () => {
  it("ranks parts independently while Hall retains one story and its overall score", () => {
    const entry = structuredClone(sampleBackup().entries[0]!);
    entry.title.category = "anime";
    const round = entry.rounds[0]!;
    entry.installments = [900, 700].map((score, index) => ({
      id: randomUUID(),
      titleId: entry.title.id,
      name: `Season ${index + 1}`,
      position: index + 1,
      releaseYear: 2020 + index,
      coverUrl: `https://example.com/${index}.jpg`,
      backdropUrl: "",
      synopsis: "",
      totalEpisodes: 12,
      viewingCount: 3,
      originalTitle: `Native ${index}`,
      runtimeMinutes: 24,
    }));
    entry.rounds = entry.installments.map((part, index) => ({
      ...round,
      id: randomUUID(),
      installmentId: part.id,
      score: [900, 700][index]!,
      episode: 1,
    }));
    const before = structuredClone(entry);
    const items = libraryEntries([entry]);
    expect(rankEntries([entry], "anime").map((item) => item.score)).toEqual([
      800,
    ]);
    expect(rankEntries(items, "anime").map((item) => item.score)).toEqual([
      900, 700,
    ]);
    expect(items.map((item) => item.storyId)).toEqual([
      entry.title.id,
      entry.title.id,
    ]);
    expect(items[0]!.title.coverUrl).toBe(entry.installments[0]!.coverUrl);
    expect(items[1]!.title.viewingCount).toBe(3);
    expect(queryLibrary(items, { search: "Season 2" })[0]!.partId).toBe(
      entry.installments[1]!.id,
    );
    expect(categoryPositions(items).get(entry.installments[1]!.id)).toBe(2);
    expect(entry).toEqual(before);
  });
  it("never reuses an old score for an unscored latest part, and keeps standalone stories", () => {
    const entry = structuredClone(sampleBackup().entries[0]!);
    const standalone = structuredClone(sampleBackup().entries[1]!);
    const part = {
      id: randomUUID(),
      titleId: entry.title.id,
      name: "Season 1",
      position: 1,
      releaseYear: null,
      coverUrl: "",
      backdropUrl: "",
      synopsis: "",
      totalEpisodes: null,
      viewingCount: 1,
      originalTitle: "",
      runtimeMinutes: null,
    };
    entry.installments = [part];
    const round = entry.rounds[0]!;
    entry.rounds = [
      {
        ...round,
        installmentId: part.id,
        score: 900,
        createdAt: "2020-01-01T00:00:00.000Z",
        startedOn: null,
        finishedOn: null,
      },
      {
        ...round,
        id: randomUUID(),
        installmentId: part.id,
        score: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        startedOn: null,
        finishedOn: null,
      },
    ];
    const items = libraryEntries([entry, standalone]);
    expect(items).toHaveLength(2);
    expect(items[1]!.title.id).toBe(standalone.title.id);
    expect(categoryPositions(items).has(part.id)).toBe(false);
    expect(
      queryLibrary(items, { minimumScore: 1 }).some(
        (item) => item.partId === part.id,
      ),
    ).toBe(false);
  });
});
