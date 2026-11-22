import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import type { TitleInput } from "@/modules/catalog/domain/title";
import { isEpisodic } from "@/modules/catalog/domain/title";
import {
  installmentInputSchema,
  type InstallmentInput,
} from "@/modules/catalog/domain/installment";
import { progressLimit, currentViewing } from "@/modules/catalog/domain/series";
import {
  organizedArchive,
  type SeriesOrganization,
} from "@/modules/backup/domain/series-organization";
import {
  nextEpisode,
  type WatchRoundInput,
} from "@/modules/watching/domain/watch-round";
import {
  archiveBackupSchema,
  createArchiveBackup,
  inspectBackup,
  type ArchiveBackup,
} from "@/modules/backup/domain/archive-backup";

export const archiveStorageKey = "mark-of-frame.archive.v1";
type JsonStorage = Pick<Storage, "getItem" | "setItem">;

/** The Sites target persists one validated JSON snapshot; a failed write never commits in memory. */
export class BrowserArchive {
  private snapshot: ArchiveEntry[] = [];
  private raw: string | null = null;
  private listeners = new Set<() => void>();
  constructor(private readonly storage: JsonStorage) {
    this.reload();
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  reload = () => {
    const raw = this.storage.getItem(archiveStorageKey);
    if (raw === this.raw) return;
    const entries =
      raw === null ? [] : archiveBackupSchema.parse(JSON.parse(raw)).entries;
    this.raw = raw;
    this.snapshot = entries;
    this.listeners.forEach((listener) => listener());
  };
  private commit<T>(change: (entries: ArchiveEntry[]) => T): T {
    this.reload();
    const previous = this.raw;
    const entries = structuredClone(this.snapshot);
    const result = change(entries);
    const validated = archiveBackupSchema.parse(createArchiveBackup(entries));
    const raw = JSON.stringify(validated);
    // All mutations run under a Web Lock in the browser action adapter. This also catches
    // stale writes in hosts without locks, without replacing the other tab's data.
    if (this.storage.getItem(archiveStorageKey) !== previous)
      throw new Error("The archive changed in another tab. Try again.");
    this.storage.setItem(archiveStorageKey, raw);
    this.raw = raw;
    this.snapshot = validated.entries;
    this.listeners.forEach((listener) => listener());
    return result;
  }
  saveTitle(input: TitleInput, id = crypto.randomUUID()): string {
    return this.commit((entries) => {
      const existing = entries.find((entry) => entry.title.id === id);
      if (existing) {
        if (
          input.totalEpisodes !== null &&
          existing.rounds.some(
            (round) =>
              !round.installmentId && round.episode > input.totalEpisodes!,
          )
        )
          throw new Error("จำนวนตอนใหม่น้อยกว่าความคืบหน้าที่บันทึกไว้");
        existing.title = { ...existing.title, ...input };
      } else
        entries.push({
          title: {
            ...input,
            id,
            isDemo: false,
            createdAt: new Date().toISOString(),
          },
          rounds: [],
        });
      return id;
    });
  }
  saveRound(input: WatchRoundInput, id?: string): void {
    this.commit((entries) => {
      const entry = entries.find((entry) => entry.title.id === input.titleId);
      if (!entry) throw new Error("ไม่พบเรื่องที่ต้องการบันทึก");
      const limit = progressLimit(entry, input.installmentId);
      if (limit !== null && input.episode > limit)
        throw new Error("ความคืบหน้าเกินจำนวนตอนทั้งหมด");
      const existing = id
        ? entry.rounds.find((round) => round.id === id)
        : undefined;
      if (id && !existing) throw new Error("ไม่พบบันทึกรอบนี้");
      const now = new Date().toISOString();
      if (existing) Object.assign(existing, input, { updatedAt: now });
      else
        entry.rounds.push({
          ...input,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        });
    });
  }
  incrementProgress(titleId: string): void {
    this.commit((entries) => {
      const entry = entries.find((entry) => entry.title.id === titleId);
      const round = entry ? currentViewing(entry) : null;
      if (!entry || !round || round.status !== "watching")
        throw new Error("เริ่มรอบที่กำลังดูก่อนบันทึกความคืบหน้า");
      if (!isEpisodic(entry.title.category))
        throw new Error("บันทึกจำนวนตอนได้เฉพาะรายการแบบตอน");
      round.episode = nextEpisode(
        round.episode,
        progressLimit(entry, round.installmentId),
      );
      round.updatedAt = new Date().toISOString();
    });
  }
  merge(backup: ArchiveBackup) {
    const validated = archiveBackupSchema.parse(backup);
    return this.commit((entries) => {
      const summary = inspectBackup(validated, inventoryOf(entries));
      const rounds = new Set(
        entries.flatMap((entry) => entry.rounds.map((round) => round.id)),
      );
      for (const incoming of validated.entries) {
        let entry = entries.find(
          (entry) => entry.title.id === incoming.title.id,
        );
        if (!entry) {
          entry = { title: incoming.title, rounds: [], installments: [] };
          entries.push(entry);
        }
        entry.installments ??= [];
        for (const part of incoming.installments) {
          if (
            entries.some((item) =>
              item.installments?.some((current) => current.id === part.id),
            )
          )
            continue;
          entry.installments.push(part);
        }
        for (const round of incoming.rounds) {
          if (rounds.has(round.id)) continue;
          const limit = progressLimit(entry, round.installmentId);
          if (limit !== null && round.episode > limit)
            throw new Error(
              "Viewing progress exceeds the existing episode total. No data was changed.",
            );
          entry.rounds.push(round);
          rounds.add(round.id);
        }
      }
      return summary;
    });
  }
  saveInstallment(input: InstallmentInput, id?: string): string {
    const validated = installmentInputSchema.parse(input);
    return this.commit((entries) => {
      const entry = entries.find((item) => item.title.id === validated.titleId);
      if (!entry) throw new Error("ไม่พบเรื่องนี้");
      entry.installments ??= [];
      if (
        entry.installments.some(
          (part) => part.position === validated.position && part.id !== id,
        )
      )
        throw new Error("ลำดับภาคนี้มีอยู่แล้ว");
      const existing = entry.installments.find((part) => part.id === id);
      if (id && !existing) throw new Error("ไม่พบภาคนี้");
      if (existing) Object.assign(existing, validated);
      else
        entry.installments.push({
          ...validated,
          id: id ?? crypto.randomUUID(),
        });
      return existing?.id ?? entry.installments.at(-1)!.id;
    });
  }
  organize(plan: SeriesOrganization): void {
    this.commit((entries) => {
      const next = organizedArchive(entries, plan);
      entries.splice(0, entries.length, ...next.entries);
    });
  }
}
export function inventoryOf(entries: ArchiveEntry[]) {
  return {
    titleIds: entries.map((entry) => entry.title.id),
    roundIds: entries.flatMap((entry) => entry.rounds.map((round) => round.id)),
    installmentIds: entries.flatMap(
      (entry) => entry.installments?.map((part) => part.id) ?? [],
    ),
  };
}
