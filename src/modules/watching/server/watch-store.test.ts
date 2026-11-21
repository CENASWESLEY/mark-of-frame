import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "@/infrastructure/database/connection";
import {
  createTitle,
  readArchive,
  readTitle,
  updateTitle,
} from "@/modules/catalog/server/title-store";
import { titleInputSchema } from "@/modules/catalog/domain/title";
import { latestRound, watchRoundInputSchema } from "../domain/watch-round";
import { incrementProgress, saveRound } from "./watch-store";
import { rankEntries } from "@/modules/rankings/domain/rankings";

let database: DatabaseSync;
let directory: string;
let filename: string;
let titleId: string;
const titleInput = () =>
  titleInputSchema.parse({
    name: "A memory",
    originalTitle: "",
    category: "anime",
    releaseYear: "2026",
    genres: "Drama, Drama, Fantasy",
    country: "Japan",
    language: "Japanese",
    coverUrl: "",
    backdropUrl: "",
    synopsis: "",
    runtimeMinutes: "",
    totalEpisodes: "2",
  });
const roundInput = (changes: Record<string, unknown> = {}) =>
  watchRoundInputSchema.parse({
    titleId,
    status: "completed",
    score: "9.85",
    season: "1",
    episode: "0",
    startedOn: "2026-11-01",
    finishedOn: "2026-11-02",
    note: "First memory",
    ...changes,
  });

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "afterframe-test-"));
  filename = join(directory, "test.sqlite");
  database = openDatabase(filename);
  titleId = createTitle(database, titleInput());
});
afterEach(() => {
  database.close();
  const target = resolve(directory);
  if (
    dirname(target) !== resolve(tmpdir()) ||
    !basename(target).startsWith("afterframe-test-")
  )
    throw new Error("Unexpected test cleanup directory");
  rmSync(target, { recursive: true, force: true });
});

describe("durable viewing archive", () => {
  it("persists data after reconnecting and applies migrations idempotently", () => {
    saveRound(database, roundInput());
    database.close();
    database = openDatabase(filename);
    expect(readTitle(database, titleId)?.rounds[0]?.note).toBe("First memory");
    expect(readTitle(database, titleId)?.title.genres).toEqual([
      "Drama",
      "Fantasy",
    ]);
  });
  it("adds a rewatch without losing old memories and updates the ranking", () => {
    saveRound(database, roundInput());
    saveRound(
      database,
      roundInput({
        score: "5.30",
        startedOn: "2026-11-20",
        finishedOn: "2026-11-21",
        note: "Changed feelings",
      }),
    );
    const archive = readArchive(database);
    expect(archive[0]?.rounds).toHaveLength(2);
    expect(rankEntries(archive, "anime")[0]?.score).toBe(530);
  });
  it("edits one round without increasing the viewing count", () => {
    const id = saveRound(database, roundInput());
    saveRound(database, roundInput({ note: "Edited", score: "8.65" }), id);
    const rounds = readTitle(database, titleId)?.rounds ?? [];
    expect(rounds).toHaveLength(1);
    expect(rounds[0]?.note).toBe("Edited");
    expect(rounds[0]?.score).toBe(865);
  });
  it("rejects an edit against another title and preserves existing data", () => {
    const id = saveRound(database, roundInput());
    const another = createTitle(database, { ...titleInput(), name: "Other" });
    expect(() =>
      saveRound(
        database,
        roundInput({ titleId: another, note: "Wrong title" }),
        id,
      ),
    ).toThrow("ไม่พบบันทึกรอบนี้");
    expect(readTitle(database, titleId)?.rounds[0]?.note).toBe("First memory");
  });
  it("increments episode progress without exceeding known episode count", () => {
    saveRound(
      database,
      roundInput({ status: "watching", episode: "1", finishedOn: "" }),
    );
    incrementProgress(database, titleId);
    incrementProgress(database, titleId);
    expect(
      latestRound(readTitle(database, titleId)?.rounds ?? [])?.episode,
    ).toBe(2);
  });
  it("rejects impossible progress without inserting a partial round", () => {
    expect(() => saveRound(database, roundInput({ episode: "3" }))).toThrow();
    expect(readTitle(database, titleId)?.rounds).toEqual([]);
  });
  it("does not increment a completed viewing", () => {
    saveRound(database, roundInput());
    expect(() => incrementProgress(database, titleId)).toThrow();
    expect(readTitle(database, titleId)?.rounds[0]?.episode).toBe(0);
  });
  it("keeps old notes when title metadata changes", () => {
    saveRound(database, roundInput());
    updateTitle(database, titleId, { ...titleInput(), name: "Renamed" });
    expect(readTitle(database, titleId)?.title.name).toBe("Renamed");
    expect(readTitle(database, titleId)?.rounds[0]?.note).toBe("First memory");
  });
  it("rejects lowering episode count below recorded progress atomically", () => {
    saveRound(database, roundInput({ episode: "2" }));
    expect(() =>
      updateTitle(database, titleId, {
        ...titleInput(),
        name: "Should not save",
        totalEpisodes: 1,
      }),
    ).toThrow();
    expect(readTitle(database, titleId)?.title.name).toBe("A memory");
    expect(readTitle(database, titleId)?.title.totalEpisodes).toBe(2);
  });
});

describe("viewing validation", () => {
  it("rejects impossible calendar dates", () =>
    expect(() =>
      roundInput({ startedOn: "2026-02-30", finishedOn: "" }),
    ).toThrow());
  it("rejects finish dates before the start", () =>
    expect(() => roundInput({ finishedOn: "2025-01-01" })).toThrow());
  it("accepts unknown viewing dates", () =>
    expect(roundInput({ startedOn: "", finishedOn: "" }).startedOn).toBeNull());
});
