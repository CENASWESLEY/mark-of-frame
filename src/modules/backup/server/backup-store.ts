import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { transaction } from "@/infrastructure/database/connection";
import { insertTitleRecord } from "@/modules/catalog/server/title-store";
import { restoreRound } from "@/modules/watching/server/watch-store";
import {
  inspectBackup,
  type ArchiveBackup,
  type BackupInventory,
  type ImportSummary,
} from "../domain/archive-backup";

export function readBackupInventory(database: DatabaseSync): BackupInventory {
  return {
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
    for (const entry of backup.entries) {
      if (!titles.has(entry.title.id)) {
        insertTitleRecord(database, entry.title);
        titles.add(entry.title.id);
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
