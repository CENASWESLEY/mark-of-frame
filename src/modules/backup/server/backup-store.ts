import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { transaction } from "@/infrastructure/database/connection";
import {
  insertTitleRecord,
  readArchive,
} from "@/modules/catalog/server/title-store";
import { insertInstallment } from "@/modules/catalog/server/installment-store";
import {
  organizedArchive,
  type SeriesOrganization,
} from "../domain/series-organization";
import { restoreRound } from "@/modules/watching/server/watch-store";
import {
  inspectBackup,
  type ArchiveBackup,
  type BackupInventory,
  type ImportSummary,
} from "../domain/archive-backup";

export function readBackupInventory(database: DatabaseSync): BackupInventory {
  return {
    installmentIds: database
      .prepare("SELECT id FROM installments")
      .all()
      .map((row) => String(row.id)),
    titleIds: database
      .prepare("SELECT id FROM titles")
      .all()
      .map((row) => String(row.id)),
    roundIds: database
      .prepare("SELECT id FROM watch_rounds")
      .all()
      .map((row) => String(row.id)),
  };
}

/** Merge is atomic and preserves all existing identities, metadata and notes. */
export function mergeBackup(
  database: DatabaseSync,
  backup: ArchiveBackup,
): ImportSummary {
  return transaction(database, () => {
    const inventory = readBackupInventory(database);
    const summary = inspectBackup(backup, inventory);
    const titles = new Set(inventory.titleIds),
      rounds = new Set(inventory.roundIds);
    const parts = new Set(inventory.installmentIds);
    for (const entry of backup.entries) {
      if (!titles.has(entry.title.id)) {
        insertTitleRecord(database, entry.title);
        titles.add(entry.title.id);
      }
      for (const part of entry.installments) {
        if (!parts.has(part.id)) {
          insertInstallment(database, part);
          parts.add(part.id);
        }
      }
      for (const round of entry.rounds) {
        if (!rounds.has(round.id)) {
          restoreRound(database, round);
          rounds.add(round.id);
        }
      }
    }
    return summary;
  });
}

export function organizeSeries(
  database: DatabaseSync,
  plan: SeriesOrganization,
): void {
  transaction(database, () => {
    const after = organizedArchive(readArchive(database), plan);
    const inventory = readBackupInventory(database),
      parts = new Set(inventory.installmentIds),
      rounds = new Set(inventory.roundIds);
    for (const entry of after.entries) {
      for (const part of entry.installments) {
        if (!parts.has(part.id)) {
          insertInstallment(database, part);
          parts.add(part.id);
        }
      }
      for (const round of entry.rounds) {
        if (!rounds.has(round.id)) {
          restoreRound(database, round);
          continue;
        }
        database
          .prepare(
            "UPDATE watch_rounds SET installment_id=?,score=?,season=?,episode=?,status=?,note=?,source_note=?,updated_at=? WHERE id=? AND title_id=?",
          )
          .run(
            round.installmentId,
            round.score,
            round.season,
            round.episode,
            round.status,
            round.note,
            round.sourceNote,
            round.updatedAt,
            round.id,
            entry.title.id,
          );
      }
    }
  });
}
