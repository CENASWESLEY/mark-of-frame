import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  nextEpisode,
  type WatchRoundInput,
  type WatchRound,
} from "../domain/watch-round";
import { readTitle } from "@/modules/catalog/server/title-store";
import { isEpisodic } from "@/modules/catalog/domain/title";
import { transaction } from "@/infrastructure/database/connection";
import { progressLimit, currentViewing } from "@/modules/catalog/domain/series";

export class WatchRuleError extends Error {}

function validateRound(database: DatabaseSync, input: WatchRoundInput) {
  const entry = readTitle(database, input.titleId);
  if (!entry) throw new WatchRuleError("ไม่พบเรื่องที่ต้องการบันทึก");
  let limit: number | null;
  try {
    limit = progressLimit(entry, input.installmentId);
  } catch {
    throw new WatchRuleError("ไม่พบซีซัน/ภาคของเรื่องนี้");
  }
  if (limit !== null && input.episode > limit)
    throw new WatchRuleError(`ภาคนี้มี ${limit} ตอน กรุณาตรวจจำนวนตอนที่ดู`);
}

export function saveRound(
  database: DatabaseSync,
  input: WatchRoundInput,
  roundId?: string,
): string {
  return transaction(database, () => {
    validateRound(database, input);
    const now = new Date().toISOString();
    if (roundId) {
      const result = database
        .prepare(
          `UPDATE watch_rounds SET status=?,score=?,season=?,episode=?,started_on=?,finished_on=?,note=?,updated_at=?,installment_id=? WHERE id=? AND title_id=?`,
        )
        .run(
          input.status,
          input.score,
          input.season,
          input.episode,
          input.startedOn,
          input.finishedOn,
          input.note,
          now,
          input.installmentId ?? null,
          roundId,
          input.titleId,
        );
      if (!result.changes) throw new WatchRuleError("ไม่พบบันทึกรอบนี้");
      return roundId;
    }
    const id = randomUUID();
    insertRoundRecord(database, {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  });
}

export function insertRoundRecord(
  database: DatabaseSync,
  input: WatchRound,
): void {
  database
    .prepare(
      `INSERT INTO watch_rounds (id,title_id,status,score,season,episode,started_on,finished_on,note,created_at,updated_at,installment_id,source_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      input.id,
      input.titleId,
      input.status,
      input.score,
      input.season,
      input.episode,
      input.startedOn,
      input.finishedOn,
      input.note,
      input.createdAt,
      input.updatedAt,
      input.installmentId ?? null,
      input.sourceNote ?? "",
    );
}

/** Snapshot restore uses the same progress rules as a normal viewing mutation. */
export function restoreRound(database: DatabaseSync, round: WatchRound): void {
  transaction(database, () => {
    validateRound(database, round);
    insertRoundRecord(database, round);
  });
}

export function incrementProgress(
  database: DatabaseSync,
  titleId: string,
): void {
  transaction(database, () => {
    const entry = readTitle(database, titleId);
    const round = entry ? currentViewing(entry) : null;
    if (!entry || !round || round.status !== "watching")
      throw new WatchRuleError("เริ่มรอบที่กำลังดูก่อนบันทึกความคืบหน้า");
    if (!isEpisodic(entry.title.category))
      throw new WatchRuleError("บันทึกจำนวนตอนได้เฉพาะรายการแบบตอน");
    const next = nextEpisode(
      round.episode,
      progressLimit(entry, round.installmentId),
    );
    database
      .prepare(
        "UPDATE watch_rounds SET episode = ?, updated_at = ? WHERE id = ?",
      )
      .run(next, new Date().toISOString(), round.id);
  });
}
