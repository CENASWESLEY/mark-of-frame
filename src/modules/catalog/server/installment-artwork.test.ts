import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sampleBackup } from "@/site/sample";
import { BrowserArchive, archiveStorageKey } from "@/site/archive-store";
import { openDatabase } from "@/infrastructure/database/connection";
import { mergeBackup } from "@/modules/backup/server/backup-store";
import {
  archiveBackupSchema,
  createArchiveBackup,
} from "@/modules/backup/domain/archive-backup";
import { libraryEntries } from "../domain/library-entries";
import { readArchive, updateTitle } from "./title-store";
import { saveInstallment } from "./installment-store";

function fixture() {
  const backup = sampleBackup();
  const entry = backup.entries[0]!;
  entry.title.coverUrl = "https://example.com/story.jpg";
  entry.installments = [1, 2, 3].map((position) => ({
    id: randomUUID(),
    titleId: entry.title.id,
    name: `Season ${position}`,
    position,
    releaseYear: 2020 + position,
    coverUrl:
      position === 3 ? "" : `https://example.com/season-${position}.jpg`,
    backdropUrl: "",
    synopsis: "",
    totalEpisodes: null,
    viewingCount: 2,
    originalTitle: "",
    runtimeMinutes: null,
  }));
  backup.entries = [entry];
  return archiveBackupSchema.parse(backup);
}

describe.each(["browser", "sqlite"] as const)(
  "%s installment artwork isolation",
  (target) => {
    it("changes only the selected season, preserves personal records and keeps Hall artwork separate", () => {
      const backup = fixture();
      const before = structuredClone(backup.entries[0]!);
      const selected = before.installments[0]!;
      const db = target === "sqlite" ? openDatabase(":memory:") : null;
      const storage = new Map([[archiveStorageKey, JSON.stringify(backup)]]);
      const browserStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      };
      const browser = new BrowserArchive(browserStorage);
      const nextCover = "https://example.com/only-season-1.jpg";
      try {
        if (db) {
          mergeBackup(db, backup);
          saveInstallment(
            db,
            { ...selected, coverUrl: nextCover },
            selected.id,
          );
        } else
          browser.saveInstallment(
            { ...selected, coverUrl: nextCover },
            selected.id,
          );
        const changed = (
          db
            ? readArchive(db)
            : new BrowserArchive(browserStorage).getSnapshot()
        )[0]!;
        expect(changed.title).toEqual(before.title);
        expect([...changed.rounds].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
          [...before.rounds].sort((a, b) => a.id.localeCompare(b.id)),
        );
        expect(changed.installments?.slice(1)).toEqual(
          before.installments.slice(1),
        );
        expect(changed.installments?.[0]).toEqual({
          ...selected,
          coverUrl: nextCover,
        });
        expect(
          libraryEntries([changed]).map((entry) => entry.title.coverUrl),
        ).toEqual([nextCover, "https://example.com/season-2.jpg", ""]);

        const newStory = {
          ...changed.title,
          coverUrl: "https://example.com/new-story.jpg",
        };
        if (db) updateTitle(db, changed.title.id, newStory);
        else browser.saveTitle(newStory, changed.title.id);
        const after = (db ? readArchive(db) : browser.getSnapshot())[0]!;
        expect(after.title.coverUrl).toBe(newStory.coverUrl);
        expect(after.installments).toEqual(changed.installments);
        expect(
          libraryEntries([after]).map((entry) => entry.title.coverUrl),
        ).toEqual([nextCover, "https://example.com/season-2.jpg", ""]);
        expect(
          archiveBackupSchema.parse(createArchiveBackup([after])).entries[0]!
            .installments,
        ).toEqual(after.installments);
      } finally {
        db?.close();
      }
    });
  },
);
