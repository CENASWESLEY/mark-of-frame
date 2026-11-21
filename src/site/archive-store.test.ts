import { beforeEach, describe, expect, it } from "vitest";
import { BrowserArchive, archiveStorageKey } from "./archive-store";
import { titleInputSchema } from "@/modules/catalog/domain/title";
import {
  watchRoundInputSchema,
  latestRound,
} from "@/modules/watching/domain/watch-round";
import { createArchiveBackup } from "@/modules/backup/domain/archive-backup";
import { sampleBackup } from "./sample";

class MemoryStorage {
  raw: string | null = null;
  fail = false;
  getItem() {
    return this.raw;
  }
  setItem(_key: string, value: string) {
    if (this.fail) throw new Error("storage full");
    this.raw = value;
  }
}
const title = () =>
  titleInputSchema.parse({
    name: "My anime",
    originalTitle: "",
    category: "anime",
    releaseYear: "2026",
    genres: "Drama",
    country: "Japan",
    language: "Japanese",
    coverUrl: "",
    backdropUrl: "",
    synopsis: "",
    runtimeMinutes: "24",
    totalEpisodes: "12",
  });
const viewing = (titleId: string, changes: Record<string, unknown> = {}) =>
  watchRoundInputSchema.parse({
    titleId,
    status: "completed",
    score: "8.65",
    season: "1",
    episode: "12",
    startedOn: "2025-01-01",
    finishedOn: "2025-01-02",
    note: "A memory ความรู้สึก",
    ...changes,
  });
let storage: MemoryStorage, archive: BrowserArchive;
beforeEach(() => {
  storage = new MemoryStorage();
  archive = new BrowserArchive(storage);
});
describe("Sites JSON archive persistence", () => {
  it("roundtrips metadata, integer scores, notes and dates through a fresh browser store", () => {
    const id = archive.saveTitle(title());
    archive.saveRound(viewing(id));
    expect(new BrowserArchive(storage).getSnapshot()).toEqual(
      archive.getSnapshot(),
    );
    expect(archive.getSnapshot()[0]?.rounds[0]?.score).toBe(865);
    expect(archiveStorageKey).toBe("mark-of-frame.archive.v1");
  });
  it("preserves earlier viewings and leaves an unscored latest round unranked", () => {
    const id = archive.saveTitle(title());
    archive.saveRound(viewing(id));
    archive.saveRound(
      viewing(id, {
        status: "watching",
        score: "",
        episode: "3",
        startedOn: "2026-01-01",
        finishedOn: "",
      }),
    );
    const rounds = archive.getSnapshot()[0]!.rounds;
    expect(rounds).toHaveLength(2);
    expect(latestRound(rounds)?.score).toBeNull();
    expect(rounds[0]?.score).toBe(865);
    archive.incrementProgress(id);
    expect(latestRound(archive.getSnapshot()[0]!.rounds)?.episode).toBe(4);
  });
  it("updates only the specified viewing and preserves its creation time", () => {
    const id = archive.saveTitle(title());
    archive.saveRound(viewing(id));
    const original = archive.getSnapshot()[0]!.rounds[0]!;
    archive.saveRound(
      viewing(id, { score: "9.53", note: "Updated memory" }),
      original.id,
    );
    expect(archive.getSnapshot()[0]!.rounds).toHaveLength(1);
    expect(archive.getSnapshot()[0]!.rounds[0]).toMatchObject({
      id: original.id,
      createdAt: original.createdAt,
      score: 953,
      note: "Updated memory",
    });
  });
  it("rejects lowering episode totals beneath stored progress without changing JSON", () => {
    const id = archive.saveTitle(title());
    archive.saveRound(viewing(id));
    const before = storage.raw;
    expect(() =>
      archive.saveTitle({ ...title(), totalEpisodes: 2 }, id),
    ).toThrow();
    expect(storage.raw).toBe(before);
  });
  it("merges by identity without replacing edits and is idempotent", () => {
    const id = archive.saveTitle(title());
    archive.saveRound(viewing(id));
    const backup = createArchiveBackup(structuredClone(archive.getSnapshot()));
    archive.saveTitle({ ...title(), name: "Edited here" }, id);
    const target = new BrowserArchive(new MemoryStorage());
    target.merge(backup);
    expect(target.getSnapshot()).toEqual(backup.entries);
    expect(archive.merge(backup)).toMatchObject({
      titlesAdded: 0,
      roundsAdded: 0,
    });
    expect(archive.getSnapshot()[0]?.title.name).toBe("Edited here");
  });
  it("rolls back every imported record when a later record conflicts with saved progress limits", () => {
    const id = archive.saveTitle({ ...title(), totalEpisodes: 2 });
    const incoming = new BrowserArchive(new MemoryStorage());
    incoming.saveTitle({ ...title(), name: "New title" });
    incoming.saveTitle(title(), id);
    incoming.saveRound(viewing(id));
    const before = storage.raw;
    expect(() =>
      archive.merge(createArchiveBackup(incoming.getSnapshot())),
    ).toThrow();
    expect(storage.raw).toBe(before);
    expect(archive.getSnapshot()).toHaveLength(1);
  });
  it("does not commit UI state when storage rejects the complete snapshot", () => {
    archive.saveTitle(title());
    const before = archive.getSnapshot(),
      raw = storage.raw;
    storage.fail = true;
    expect(() =>
      archive.saveTitle({ ...title(), name: "Cannot save" }),
    ).toThrow("storage full");
    expect(archive.getSnapshot()).toBe(before);
    expect(storage.raw).toBe(raw);
  });
  it("preserves corrupt JSON rather than silently replacing it with an empty collection", () => {
    storage.raw = "{broken";
    expect(() => new BrowserArchive(storage)).toThrow();
    expect(storage.raw).toBe("{broken");
  });
  it("reloads another tab's committed records before its next mutation", () => {
    const second = new BrowserArchive(storage);
    archive.saveTitle(title());
    second.saveTitle({ ...title(), name: "Second tab" });
    archive.reload();
    expect(archive.getSnapshot()).toHaveLength(2);
  });
  it("loads labeled sample records only through explicit import, with stable identities", () => {
    expect(archive.getSnapshot()).toHaveLength(0);
    archive.merge(sampleBackup());
    expect(archive.getSnapshot().every((entry) => entry.title.isDemo)).toBe(
      true,
    );
    expect(archive.merge(sampleBackup())).toMatchObject({
      titlesAdded: 0,
      roundsAdded: 0,
    });
  });
});
