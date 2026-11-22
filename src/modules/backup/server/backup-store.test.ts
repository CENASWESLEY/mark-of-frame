import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  openDatabase,
  transaction,
} from "@/infrastructure/database/connection";
import { titleInputSchema } from "@/modules/catalog/domain/title";
import {
  createTitle,
  readArchive,
  readTitle,
  updateTitle,
} from "@/modules/catalog/server/title-store";
import { saveRound } from "@/modules/watching/server/watch-store";
import { watchRoundInputSchema } from "@/modules/watching/domain/watch-round";
import {
  archiveBackupSchema,
  createArchiveBackup,
  inspectBackup,
} from "../domain/archive-backup";
import { mergeBackup, readBackupInventory } from "./backup-store";

let db: DatabaseSync, titleId: string, roundId: string;
const input = () =>
  titleInputSchema.parse({
    name: "Original story",
    originalTitle: "",
    category: "anime",
    releaseYear: "2026",
    genres: "Drama",
    country: "Japan",
    language: "Japanese",
    coverUrl: "",
    backdropUrl: "",
    synopsis: "A story",
    runtimeMinutes: "24",
    totalEpisodes: "2",
  });
const round = (id: string, changes: Record<string, unknown> = {}) =>
  watchRoundInputSchema.parse({
    titleId: id,
    status: "completed",
    score: "8.65",
    season: "1",
    episode: "1",
    startedOn: "2026-11-20",
    finishedOn: "2026-11-21",
    note: "A memory worth preserving. ความทรงจำ",
    ...changes,
  });
const snapshot = () =>
  createArchiveBackup(readArchive(db), "2026-11-21T00:00:00.000Z");
beforeEach(() => {
  db = openDatabase(":memory:");
  titleId = createTitle(db, input());
  roundId = saveRound(db, round(titleId));
});
afterEach(() => db.close());

describe("backup validation and roundtrip", () => {
  it("roundtrips title identities, scores, notes and dates into an empty database", () => {
    const backup = archiveBackupSchema.parse(
      JSON.parse(JSON.stringify(snapshot())),
    );
    const target = openDatabase(":memory:");
    try {
      expect(mergeBackup(target, backup)).toEqual({
        titlesAdded: 1,
        roundsAdded: 1,
        titlesKept: 0,
        roundsKept: 0,
      });
      expect(readArchive(target)).toEqual(readArchive(db));
    } finally {
      target.close();
    }
  });
  it("accepts version-one exports from before the explicit score unit", () => {
    const { scoreUnit, ...legacy } = snapshot();
    expect(scoreUnit).toBe("hundredths");
    expect(archiveBackupSchema.parse(legacy).scoreUnit).toBe("hundredths");
  });
  it.each([1001, -1, 865.5])(
    "rejects invalid integer-hundredth scores %s",
    (score) => {
      const backup = snapshot();
      const item = backup.entries[0];
      if (!item) throw Error("fixture missing");
      item.rounds[0]!.score = score;
      expect(archiveBackupSchema.safeParse(backup).success).toBe(false);
    },
  );
  it("rejects unsupported future versions", () =>
    expect(
      archiveBackupSchema.safeParse({ ...snapshot(), schemaVersion: 3 })
        .success,
    ).toBe(false));
  it("rejects duplicate title identities", () => {
    const backup = snapshot();
    backup.entries.push(...backup.entries);
    expect(archiveBackupSchema.safeParse(backup).success).toBe(false);
  });
  it("rejects duplicate viewing identities", () => {
    const backup = snapshot();
    const item = backup.entries[0];
    if (!item) throw Error("fixture missing");
    item.rounds.push(...item.rounds);
    expect(archiveBackupSchema.safeParse(backup).success).toBe(false);
  });
  it("rejects viewings attached to the wrong title", () => {
    const backup = snapshot();
    const item = backup.entries[0]?.rounds[0];
    if (!item) throw Error("fixture missing");
    item.titleId = randomUUID();
    expect(archiveBackupSchema.safeParse(backup).success).toBe(false);
  });
  it("rejects impossible calendar dates", () => {
    const backup = snapshot();
    const item = backup.entries[0]?.rounds[0];
    if (!item) throw Error("fixture missing");
    item.finishedOn = "2026-02-30";
    expect(archiveBackupSchema.safeParse(backup).success).toBe(false);
  });
  it("accepts the longest genre string permitted by title input", () => {
    const original = input();
    const genres = titleInputSchema.parse({
      ...original,
      genres: "x".repeat(500),
    }).genres;
    updateTitle(db, titleId, { ...original, genres });
    expect(archiveBackupSchema.safeParse(snapshot()).success).toBe(true);
  });
  it("preview reports records already present without changing data", () => {
    const before = readArchive(db);
    expect(inspectBackup(snapshot(), readBackupInventory(db))).toEqual({
      titlesAdded: 0,
      roundsAdded: 0,
      titlesKept: 1,
      roundsKept: 1,
    });
    expect(readArchive(db)).toEqual(before);
  });
});

describe("atomic non-destructive merge", () => {
  it("reimport is idempotent and preserves edits made after export", () => {
    const backup = snapshot();
    updateTitle(db, titleId, { ...input(), name: "Locally edited" });
    saveRound(
      db,
      round(titleId, { score: "5.30", note: "A newer local feeling" }),
      roundId,
    );
    expect(mergeBackup(db, backup)).toEqual({
      titlesAdded: 0,
      roundsAdded: 0,
      titlesKept: 1,
      roundsKept: 1,
    });
    expect(readTitle(db, titleId)?.title.name).toBe("Locally edited");
    expect(readTitle(db, titleId)?.rounds[0]?.score).toBe(530);
    expect(readTitle(db, titleId)?.rounds[0]?.note).toBe(
      "A newer local feeling",
    );
  });
  it("adds missing viewing records to an existing title", () => {
    const backup = snapshot();
    const item = backup.entries[0],
      old = item?.rounds[0];
    if (!item || !old) throw Error("fixture missing");
    item.rounds.push({
      ...old,
      id: randomUUID(),
      score: 530,
      note: "Imported rewatch",
      startedOn: "2026-11-22",
      finishedOn: "2026-11-23",
    });
    expect(mergeBackup(db, archiveBackupSchema.parse(backup)).roundsAdded).toBe(
      1,
    );
    expect(readTitle(db, titleId)?.rounds).toHaveLength(2);
  });
  it("rolls back new titles and viewings if an imported round conflicts with existing episode limits", () => {
    const backup = snapshot(),
      original = backup.entries[0],
      old = original?.rounds[0];
    if (!original || !old) throw Error("fixture missing");
    const newId = randomUUID();
    const fresh = {
      title: { ...original.title, id: newId, name: "Should roll back" },
      rounds: [{ ...old, id: randomUUID(), titleId: newId }],
    };
    const conflicting = {
      title: { ...original.title, totalEpisodes: 10 },
      rounds: [{ ...old, id: randomUUID(), episode: 9 }],
    };
    const validFile = archiveBackupSchema.parse({
      ...backup,
      entries: [fresh, conflicting],
    });
    expect(() => mergeBackup(db, validFile)).toThrow();
    expect(readTitle(db, newId)).toBeNull();
    expect(readArchive(db)).toHaveLength(1);
    expect(readTitle(db, titleId)?.rounds).toHaveLength(1);
    expect(db.isTransaction).toBe(false);
  });
  it("nested savepoints isolate a failed inner operation without losing the successful outer operation", () => {
    transaction(db, () => {
      updateTitle(db, titleId, { ...input(), name: "Outer update" });
      try {
        transaction(db, () => {
          saveRound(db, round(titleId, { note: "Must roll back" }));
          throw Error("stop inner");
        });
      } catch (error) {
        expect((error as Error).message).toBe("stop inner");
      }
    });
    expect(readTitle(db, titleId)?.title.name).toBe("Outer update");
    expect(readTitle(db, titleId)?.rounds).toHaveLength(1);
    expect(db.isTransaction).toBe(false);
  });
});
