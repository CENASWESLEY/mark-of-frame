import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "@/infrastructure/database/connection";
import { sampleBackup } from "@/site/sample";
import { BrowserArchive } from "@/site/archive-store";
import { readArchive } from "@/modules/catalog/server/title-store";
import { saveInstallment } from "@/modules/catalog/server/installment-store";
import {
  incrementProgress,
  saveRound,
} from "@/modules/watching/server/watch-store";
import { watchRoundInputSchema } from "@/modules/watching/domain/watch-round";
import {
  archiveBackupSchema,
  createArchiveBackup,
} from "../domain/archive-backup";
import { seriesOrganizationSchema } from "../domain/series-organization";
import { mergeBackup, organizeSeries } from "./backup-store";
let db: DatabaseSync;
beforeEach(() => {
  db = openDatabase(":memory:");
  const sample = sampleBackup();
  for (const entry of sample.entries) entry.title.category = "anime";
  mergeBackup(db, sample);
});
afterEach(() => db.close());
function plan() {
  const before = createArchiveBackup(readArchive(db)),
    after = structuredClone(before),
    entry = after.entries[0]!,
    part = {
      id: randomUUID(),
      titleId: entry.title.id,
      name: "Season 1",
      position: 1,
      viewingCount: 0,
      originalTitle: "",
      runtimeMinutes: null,
      releaseYear: 2026,
      coverUrl: "",
      backdropUrl: "",
      synopsis: "",
      totalEpisodes: 3,
    };
  entry.installments.push(part);
  const round = entry.rounds[0]!;
  round.sourceNote = round.note;
  round.note = "Only a feeling";
  round.installmentId = part.id;
  round.episode = 2;
  round.status = "watching";
  return seriesOrganizationSchema.parse({
    kind: "series-organization",
    before,
    after,
  });
}
describe("reviewed series organization", () => {
  it("rolls back new installments and earlier updates if a later viewing write fails", () => {
    const change = plan(),
      entry = change.after.entries[0]!;
    entry.rounds.push({
      ...entry.rounds[0]!,
      id: randomUUID(),
      note: "trigger failure",
      sourceNote: "",
    });
    db.exec(
      "CREATE TRIGGER fail_organization BEFORE INSERT ON watch_rounds WHEN NEW.note='trigger failure' BEGIN SELECT RAISE(ABORT,'write failed'); END",
    );
    const original = readArchive(db);
    expect(() => organizeSeries(db, change)).toThrow("write failed");
    expect(readArchive(db)).toEqual(original);
  });
  it("preserves identities and raw notes across SQLite and JSON roundtrip, and is idempotent", () => {
    const change = plan();
    organizeSeries(db, change);
    organizeSeries(db, change);
    expect(createArchiveBackup(readArchive(db)).entries).toEqual(
      change.after.entries,
    );
    const copy = openDatabase(":memory:");
    try {
      mergeBackup(copy, createArchiveBackup(readArchive(db)));
      expect(readArchive(copy)).toEqual(readArchive(db));
    } finally {
      copy.close();
    }
  });
  it("rejects a stale before-state without changing any rows", () => {
    const change = plan();
    const entry = readArchive(db)[0]!;
    saveInstallment(db, {
      titleId: entry.title.id,
      name: "Another part",
      position: 8,
      releaseYear: null,
      coverUrl: "",
      backdropUrl: "",
      synopsis: "",
      totalEpisodes: null,
    });
    const current = readArchive(db);
    expect(() => organizeSeries(db, change)).toThrow(/changed/);
    expect(readArchive(db)).toEqual(current);
  });
  it("requires preserving original text when cleaning notes", () => {
    const change = plan();
    change.after.entries[0]!.rounds[0]!.sourceNote = "";
    expect(seriesOrganizationSchema.safeParse(change).success).toBe(false);
  });
  it("rejects deleting a viewing or altering its historical dates", () => {
    const change = plan();
    change.after.entries[0]!.rounds = [];
    expect(seriesOrganizationSchema.safeParse(change).success).toBe(false);
    const second = plan();
    second.after.entries[0]!.rounds[0]!.startedOn = "2000-01-01";
    expect(seriesOrganizationSchema.safeParse(second).success).toBe(false);
  });
  it("rolls back every browser change when storage cannot accept the organized archive", () => {
    const change = plan();
    let raw = JSON.stringify(change.before);
    let fail = false;
    const store = new BrowserArchive({
      getItem: () => raw,
      setItem: (_key, value) => {
        if (fail) throw new Error("full");
        raw = value;
      },
    });
    const original = store.getSnapshot();
    fail = true;
    expect(() => store.organize(change)).toThrow("full");
    expect(store.getSnapshot()).toEqual(original);
    fail = false;
    store.organize(change);
    store.organize(change);
    expect(store.getSnapshot()).toEqual(change.after.entries);
  });
  it("uses each part’s episode limit and rejects a part owned by another title", () => {
    const change = plan();
    organizeSeries(db, change);
    const entry = readArchive(db).find(
      (item) => item.title.id === change.after.entries[0]!.title.id,
    )!;
    incrementProgress(db, entry.title.id);
    expect(
      readArchive(db).find((item) => item.title.id === entry.title.id)!
        .rounds[0]!.episode,
    ).toBe(3);
    const round = entry.rounds[0]!;
    const input = watchRoundInputSchema.parse({
      ...round,
      score: "8",
      startedOn: "",
      finishedOn: "",
      episode: 4,
    });
    expect(() => saveRound(db, input)).toThrow();
    const other = readArchive(db).find(
      (item) => item.title.id !== entry.title.id,
    )!;
    expect(() =>
      saveRound(db, { ...input, titleId: other.title.id, episode: 1 }),
    ).toThrow();
  });
  it("normalizes version-one archives and rejects duplicate part positions and missing references", () => {
    const change = plan();
    const old = structuredClone(change.before);
    expect(
      archiveBackupSchema.parse({ ...old, schemaVersion: 1 }).schemaVersion,
    ).toBe(2);
    const entry = change.after.entries[0]!;
    entry.installments.push({ ...entry.installments[0]!, id: randomUUID() });
    expect(archiveBackupSchema.safeParse(change.after).success).toBe(false);
  });
  it("keeps ordinary imports non-destructive when a season with the same identity has changed", () => {
    const change = plan();
    organizeSeries(db, change);
    const incoming = structuredClone(change.after);
    incoming.entries[0]!.installments[0]!.name = "Overwrite attempt";
    mergeBackup(db, incoming);
    expect(
      readArchive(db).find(
        (item) => item.title.id === incoming.entries[0]!.title.id,
      )!.installments![0]!.name,
    ).toBe("Season 1");
  });
});
