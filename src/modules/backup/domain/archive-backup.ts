import { z } from "zod";
import {
  legacyViewingCount,
  viewingCountValueSchema,
} from "@/modules/catalog/domain/viewing-count";
import { titleInputSchema } from "@/modules/catalog/domain/title";
import { installmentInputSchema } from "@/modules/catalog/domain/installment";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import {
  watchRoundInputSchema,
  watchStatuses,
} from "@/modules/watching/domain/watch-round";

export const maximumBackupBytes = 8 * 1024 * 1024;
const timestamp = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());
const titleSnapshot = titleInputSchema.omit({ genres: true }).extend({
  id: z.string().uuid(),
  genres: z.array(z.string().trim().min(1).max(500)).max(20),
  isDemo: z.boolean(),
  createdAt: timestamp,
  viewingCount: viewingCountValueSchema.optional(),
});
const roundSnapshot = z
  .object({
    id: z.string().uuid(),
    titleId: z.string().uuid(),
    installmentId: z.string().uuid().nullable().optional().default(null),
    status: z.enum(watchStatuses.map((status) => status.id)),
    score: z.number().int().min(0).max(1000).nullable(),
    season: z.number().int().min(1).max(1000),
    episode: z.number().int().min(0).max(100000),
    startedOn: watchRoundInputSchema.shape.startedOn.nullable(),
    finishedOn: watchRoundInputSchema.shape.finishedOn.nullable(),
    note: z.string().max(20000),
    sourceNote: z.string().max(40000).optional().default(""),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .refine(
    (round) =>
      !round.startedOn ||
      !round.finishedOn ||
      round.startedOn <= round.finishedOn,
    { message: "A viewing ends before it starts.", path: ["finishedOn"] },
  );

export const archiveBackupSchema = z
  .object({
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    scoreUnit: z.literal("hundredths").optional().default("hundredths"),
    exportedAt: timestamp,
    entries: z
      .array(
        z.object({
          title: titleSnapshot,
          installments: z
            .array(
              installmentInputSchema.extend({
                id: z.string().uuid(),
                viewingCount: viewingCountValueSchema.optional(),
              }),
            )
            .max(1000)
            .optional()
            .default([]),
          rounds: z.array(roundSnapshot).max(10000),
        }),
      )
      .max(10000),
  })
  .superRefine((backup, context) => {
    const titles = new Set<string>(),
      rounds = new Set<string>(),
      parts = new Set<string>();
    let roundCount = 0;
    for (const [index, entry] of backup.entries.entries()) {
      if (titles.has(entry.title.id))
        context.addIssue({
          code: "custom",
          message: "Duplicate title identity.",
          path: ["entries", index, "title", "id"],
        });
      titles.add(entry.title.id);
      const positions = new Set<number>();
      for (const part of entry.installments) {
        if (
          parts.has(part.id) ||
          positions.has(part.position) ||
          part.titleId !== entry.title.id
        )
          context.addIssue({
            code: "custom",
            message: "Invalid or duplicate series installment.",
            path: ["entries", index, "installments"],
          });
        parts.add(part.id);
        positions.add(part.position);
      }
      for (const round of entry.rounds) {
        roundCount++;
        if (rounds.has(round.id))
          context.addIssue({
            code: "custom",
            message: "Duplicate viewing identity.",
            path: ["entries", index, "rounds"],
          });
        rounds.add(round.id);
        if (round.titleId !== entry.title.id)
          context.addIssue({
            code: "custom",
            message: "A viewing belongs to a different title.",
            path: ["entries", index, "rounds"],
          });
        const part = round.installmentId
          ? entry.installments.find((part) => part.id === round.installmentId)
          : null;
        if (round.installmentId && !part)
          context.addIssue({
            code: "custom",
            message: "Viewing belongs to an unknown installment.",
            path: ["entries", index, "rounds"],
          });
        const limit = part ? part.totalEpisodes : entry.title.totalEpisodes;
        if (limit !== null && round.episode > limit)
          context.addIssue({
            code: "custom",
            message: "Viewing progress exceeds the episode total.",
            path: ["entries", index, "rounds"],
          });
      }
    }
    if (roundCount > 100000)
      context.addIssue({
        code: "custom",
        message: "Too many viewing records.",
      });
  })
  .transform((backup) => ({
    ...backup,
    schemaVersion: 2 as const,
    entries: backup.entries.map((entry) => ({
      ...entry,
      title: {
        ...entry.title,
        viewingCount:
          entry.title.viewingCount ??
          legacyViewingCount(
            entry.rounds,
            entry.installments.map((part) => part.id),
          ),
      },
      installments: entry.installments.map((part) => ({
        ...part,
        originalTitle: part.originalTitle ?? "",
        runtimeMinutes: part.runtimeMinutes ?? null,
        viewingCount:
          part.viewingCount ??
          legacyViewingCount(
            entry.rounds.filter((round) => round.installmentId === part.id),
          ),
      })),
    })),
  }));

export type ArchiveBackup = z.output<typeof archiveBackupSchema>;
export type BackupInventory = {
  titleIds: string[];
  roundIds: string[];
  installmentIds?: string[];
};
export type ImportSummary = {
  titlesAdded: number;
  roundsAdded: number;
  titlesKept: number;
  roundsKept: number;
  installmentsAdded?: number;
};

export function createArchiveBackup(
  entries: ArchiveEntry[],
  exportedAt = new Date().toISOString(),
): ArchiveBackup {
  return archiveBackupSchema.parse({
    schemaVersion: 2,
    scoreUnit: "hundredths",
    exportedAt,
    entries,
  });
}

export function inspectBackup(
  backup: ArchiveBackup,
  inventory: BackupInventory,
): ImportSummary {
  const titles = new Set(inventory.titleIds),
    rounds = new Set(inventory.roundIds);
  const summary: ImportSummary = {
    titlesAdded: 0,
    roundsAdded: 0,
    titlesKept: 0,
    roundsKept: 0,
  };
  for (const entry of backup.entries) {
    const added = entry.installments.filter(
      (part) => !inventory.installmentIds?.includes(part.id),
    ).length;
    if (added)
      summary.installmentsAdded = (summary.installmentsAdded ?? 0) + added;
    if (titles.has(entry.title.id)) summary.titlesKept++;
    else summary.titlesAdded++;
    for (const round of entry.rounds) {
      if (rounds.has(round.id)) summary.roundsKept++;
      else summary.roundsAdded++;
    }
  }
  return summary;
}
