import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  installmentInputSchema,
  type Installment,
  type InstallmentInput,
} from "../domain/installment";
import { transaction } from "@/infrastructure/database/connection";
import { z } from "zod";

export function readInstallments(database: DatabaseSync): Installment[] {
  return database
    .prepare("SELECT * FROM installments ORDER BY position, id")
    .all()
    .map((row) =>
      installmentInputSchema.extend({ id: z.string().uuid() }).parse({
        id: row.id,
        titleId: row.title_id,
        name: row.name,
        position: row.position,
        releaseYear: row.release_year,
        coverUrl: row.cover_url,
        backdropUrl: row.backdrop_url,
        synopsis: row.synopsis,
        totalEpisodes: row.total_episodes,
        originalTitle: row.original_title,
        runtimeMinutes: row.runtime_minutes,
        viewingCount: row.viewing_count,
      }),
    );
}
export function insertInstallment(
  database: DatabaseSync,
  part: Installment,
): void {
  database
    .prepare(
      "INSERT INTO installments (id,title_id,name,position,release_year,cover_url,backdrop_url,synopsis,total_episodes,original_title,runtime_minutes,viewing_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      part.id,
      part.titleId,
      part.name,
      part.position,
      part.releaseYear,
      part.coverUrl,
      part.backdropUrl,
      part.synopsis,
      part.totalEpisodes,
      part.originalTitle ?? "",
      part.runtimeMinutes ?? null,
      part.viewingCount ?? 0,
    );
}
export function saveInstallment(
  database: DatabaseSync,
  input: InstallmentInput,
  id?: string,
): string {
  return transaction(database, () => {
    const validated = installmentInputSchema.parse(input);
    if (
      !database.prepare("SELECT id FROM titles WHERE id=?").get(input.titleId)
    )
      throw new Error("ไม่พบเรื่องนี้");
    if (
      database
        .prepare(
          "SELECT id FROM installments WHERE title_id=? AND position=? AND id<>?",
        )
        .get(input.titleId, input.position, id ?? "")
    )
      throw new Error("ลำดับภาคนี้มีอยู่แล้ว กรุณาเลือกลำดับอื่น");
    if (!id) {
      const next = randomUUID();
      insertInstallment(database, { ...validated, id: next });
      return next;
    }
    if (
      input.totalEpisodes !== null &&
      database
        .prepare(
          "SELECT id FROM watch_rounds WHERE installment_id=? AND episode>? LIMIT 1",
        )
        .get(id, input.totalEpisodes)
    )
      throw new Error("จำนวนตอนน้อยกว่าความคืบหน้าที่บันทึกไว้");
    const result = database
      .prepare(
        "UPDATE installments SET name=?,position=?,release_year=?,cover_url=?,backdrop_url=?,synopsis=?,total_episodes=?,original_title=?,runtime_minutes=?,viewing_count=COALESCE(?,viewing_count) WHERE id=? AND title_id=?",
      )
      .run(
        input.name,
        input.position,
        input.releaseYear,
        input.coverUrl,
        input.backdropUrl,
        input.synopsis,
        input.totalEpisodes,
        input.originalTitle ?? "",
        input.runtimeMinutes ?? null,
        input.viewingCount ?? null,
        id,
        input.titleId,
      );
    if (!result.changes) throw new Error("ไม่พบภาคนี้");
    return id;
  });
}
