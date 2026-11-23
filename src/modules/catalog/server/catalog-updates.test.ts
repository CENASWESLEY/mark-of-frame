import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { openDatabase } from "@/infrastructure/database/connection";
import { migrations } from "@/infrastructure/database/migrations";
import { sampleBackup } from "@/site/sample";
import { BrowserArchive, archiveStorageKey } from "@/site/archive-store";
import {
  archiveBackupSchema,
  createArchiveBackup,
} from "@/modules/backup/domain/archive-backup";
import { mergeBackup } from "@/modules/backup/server/backup-store";
import { readArchive, updateTitle } from "./title-store";
import { saveRound } from "@/modules/watching/server/watch-store";
import { watchRoundInputSchema } from "@/modules/watching/domain/watch-round";
import { titleInputSchema } from "../domain/title";
import { refreshCatalogMetadata } from "../domain/metadata-refresh";
import { storyViewings } from "../domain/series";
import type { ArchiveEntry } from "../domain/archive-entry";

function storageFor(backup = sampleBackup()) {
  const storage = new Map([[archiveStorageKey, JSON.stringify(backup)]]);
  const archive = new BrowserArchive({
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
  });
  return { archive, storage };
}
const reviewInput = (titleId: string) =>
  watchRoundInputSchema.parse({
    titleId,
    status: "completed",
    score: "7.50",
    season: 1,
    episode: 0,
    startedOn: "",
    finishedOn: "",
    note: "Another personal review",
  });

describe("independent viewing counts and metadata imports", () => {
  it("validates explicit zero and rejects negative, fractional or oversized counts", () => {
    const title = sampleBackup().entries[0]!.title;
    const input = { ...title, genres: title.genres.join(",") };
    expect(
      titleInputSchema.parse({ ...input, viewingCount: "0" }).viewingCount,
    ).toBe(0);
    for (const count of [-1, 1.5, 100001, "invalid"])
      expect(
        titleInputSchema.safeParse({ ...input, viewingCount: count }).success,
      ).toBe(false);
    const invalidSnapshot = sampleBackup();
    expect(
      archiveBackupSchema.safeParse({
        ...invalidSnapshot,
        entries: [
          {
            ...invalidSnapshot.entries[0],
            title: { ...title, viewingCount: true },
          },
        ],
      }).success,
    ).toBe(false);
  });
  it("freezes legacy counts on import, keeps explicit zero and does not count new reviews", () => {
    const old = sampleBackup();
    const first: ArchiveEntry = old.entries[0]!;
    delete first.title.viewingCount;
    const expected = first.rounds.filter(
      (round) => round.status === "completed",
    ).length;
    const parsed = archiveBackupSchema.parse(old);
    expect(parsed.entries[0]!.title.viewingCount).toBe(expected);
    parsed.entries[0]!.title.viewingCount = 0;
    const { archive } = storageFor(parsed);
    archive.saveRound(reviewInput(first.title.id));
    expect(storyViewings(archive.getSnapshot()[0]!)).toBe(0);
    const exported = createArchiveBackup(archive.getSnapshot());
    expect(
      archiveBackupSchema.parse(JSON.parse(JSON.stringify(exported)))
        .entries[0]!.title.viewingCount,
    ).toBe(0);
  });
  it("stores manual SQLite counts without creating fake viewings or changing scores", () => {
    const db = openDatabase(":memory:");
    try {
      mergeBackup(db, sampleBackup());
      const entry = readArchive(db)[0]!;
      const before = structuredClone(entry.rounds);
      updateTitle(db, entry.title.id, { ...entry.title, viewingCount: 7 });
      expect(
        readArchive(db).find((item) => item.title.id === entry.title.id)!
          .rounds,
      ).toEqual(before);
      saveRound(db, reviewInput(entry.title.id));
      expect(
        readArchive(db).find((item) => item.title.id === entry.title.id)!.title
          .viewingCount,
      ).toBe(7);
    } finally {
      db.close();
    }
  });
  it("migrates old SQLite counts once rather than reading review totals on every request", () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec(migrations[0].sql);
      db.exec(migrations[1].sql);
      const id = randomUUID();
      db.prepare(
        "INSERT INTO titles (id,name,category,created_at) VALUES (?,?,?,?)",
      ).run(id, "Legacy", "anime", "2020-01-01T00:00:00.000Z");
      for (let index = 0; index < 3; index++)
        db.prepare(
          "INSERT INTO watch_rounds (id,title_id,status,created_at,updated_at) VALUES (?,?,?,?,?)",
        ).run(
          randomUUID(),
          id,
          "completed",
          "2020-01-01T00:00:00.000Z",
          "2020-01-01T00:00:00.000Z",
        );
      db.exec(migrations[2].sql);
      migrations[2].after(db);
      expect(readArchive(db)[0]!.title.viewingCount).toBe(3);
      saveRound(db, reviewInput(id));
      expect(readArchive(db)[0]!.title.viewingCount).toBe(3);
    } finally {
      db.close();
    }
  });
  it("keeps separate part counts through edits, metadata refresh and JSON export", () => {
    const backup = sampleBackup();
    const entry = backup.entries[0]!;
    const part = {
      id: randomUUID(),
      titleId: entry.title.id,
      name: "Season 1",
      position: 1,
      releaseYear: 2020,
      coverUrl: "",
      backdropUrl: "",
      synopsis: "",
      totalEpisodes: 12,
      viewingCount: 6,
      originalTitle: "Native season",
      runtimeMinutes: 24,
    };
    entry.installments = [part];
    const { archive } = storageFor(backup);
    archive.saveInstallment({ ...part, viewingCount: undefined }, part.id);
    archive.saveRound({
      ...reviewInput(entry.title.id),
      installmentId: part.id,
    });
    const incoming = createArchiveBackup(
      structuredClone(archive.getSnapshot()),
    );
    incoming.entries[0]!.installments[0]!.viewingCount = 1;
    incoming.entries[0]!.installments[0]!.coverUrl =
      "https://example.com/season.jpg";
    archive.merge(incoming, true);
    const updated = createArchiveBackup(archive.getSnapshot()).entries[0]!
      .installments[0]!;
    expect(updated.viewingCount).toBe(6);
    expect(updated.coverUrl).toBe("https://example.com/season.jpg");
    const db = openDatabase(":memory:");
    try {
      mergeBackup(db, createArchiveBackup(archive.getSnapshot()));
      expect(
        readArchive(db).find((item) => item.title.id === entry.title.id)!
          .installments?.[0]?.viewingCount,
      ).toBe(6);
    } finally {
      db.close();
    }
  });
  it("refreshes only metadata while keeping edited scores, counts, identity, feelings and dates", () => {
    const backup = sampleBackup();
    backup.entries[0]!.title.viewingCount = 9;
    backup.entries[0]!.rounds[0]!.note = "My own words";
    const { archive } = storageFor(backup);
    const incoming = structuredClone(backup);
    incoming.entries[0]!.title.coverUrl = "https://example.com/new.jpg";
    incoming.entries[0]!.title.viewingCount = 1;
    incoming.entries[0]!.rounds[0]!.note = "Stale file";
    incoming.entries[0]!.rounds[0]!.score = 0;
    archive.merge(incoming, true);
    const after = archive.getSnapshot()[0]!;
    expect(after.title.coverUrl).toBe("https://example.com/new.jpg");
    expect(after.title.viewingCount).toBe(9);
    expect(after.rounds).toEqual(backup.entries[0]!.rounds);
    expect(refreshCatalogMetadata(after, incoming.entries[0]!).rounds).toEqual(
      after.rounds,
    );
  });
  it("keeps ordinary merge additive, and rolls a metadata batch back when later progress conflicts", () => {
    const db = openDatabase(":memory:");
    try {
      const backup = sampleBackup();
      mergeBackup(db, backup);
      const before = readArchive(db);
      const incoming = createArchiveBackup(structuredClone(before));
      incoming.entries[0]!.title.coverUrl = "https://example.com/new.jpg";
      mergeBackup(db, incoming);
      expect(readArchive(db)).toEqual(before);
      const conflict = incoming.entries.find((entry) =>
        entry.rounds.some((round) => round.episode > 1),
      )!;
      expect(conflict).toBeDefined();
      conflict.title.totalEpisodes = 1;
      expect(() => mergeBackup(db, incoming, true)).toThrow(/progress/);
      expect(readArchive(db)).toEqual(before);
    } finally {
      db.close();
    }
  });
});
