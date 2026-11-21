import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseSync, SQLOutputValue } from "node:sqlite";
import { z } from "zod";
import { categorySchema, type Title, type TitleInput } from "../domain/title";
import {
  watchStatuses,
  type WatchRound,
} from "@/modules/watching/domain/watch-round";
import type { ArchiveEntry } from "@/modules/catalog/domain/archive-entry";
import { transaction } from "@/infrastructure/database/connection";

export class TitleRuleError extends Error {}

type Row = Record<string, SQLOutputValue>;
const titleRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  original_title: z.string(),
  category: categorySchema,
  release_year: z.number().nullable(),
  genres: z.string(),
  country: z.string(),
  language: z.string(),
  cover_url: z.string(),
  backdrop_url: z.string(),
  synopsis: z.string(),
  runtime_minutes: z.number().nullable(),
  total_episodes: z.number().nullable(),
  is_demo: z.number(),
  created_at: z.string(),
});
const roundRowSchema = z.object({
  id: z.string(),
  title_id: z.string(),
  status: z.enum(watchStatuses.map((status) => status.id)),
  score: z.number().nullable(),
  season: z.number(),
  episode: z.number(),
  started_on: z.string().nullable(),
  finished_on: z.string().nullable(),
  note: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

function decodeTitle(row: Row): Title {
  const title = titleRowSchema.parse(row);
  return {
    id: title.id,
    name: title.name,
    originalTitle: title.original_title,
    category: title.category,
    releaseYear: title.release_year,
    genres: z.array(z.string()).parse(JSON.parse(title.genres)),
    country: title.country,
    language: title.language,
    coverUrl: title.cover_url,
    backdropUrl: title.backdrop_url,
    synopsis: title.synopsis,
    runtimeMinutes: title.runtime_minutes,
    totalEpisodes: title.total_episodes,
    isDemo: title.is_demo === 1,
    createdAt: title.created_at,
  };
}

export function decodeRound(row: Row): WatchRound {
  const round = roundRowSchema.parse(row);
  return {
    id: round.id,
    titleId: round.title_id,
    status: round.status,
    score: round.score,
    season: round.season,
    episode: round.episode,
    startedOn: round.started_on,
    finishedOn: round.finished_on,
    note: round.note,
    createdAt: round.created_at,
    updatedAt: round.updated_at,
  };
}

export function readArchive(database: DatabaseSync): ArchiveEntry[] {
  const grouped = new Map<string, WatchRound[]>();
  for (const row of database
    .prepare("SELECT * FROM watch_rounds ORDER BY created_at DESC, id DESC")
    .all()) {
    const round = decodeRound(row);
    const group = grouped.get(round.titleId) ?? [];
    group.push(round);
    grouped.set(round.titleId, group);
  }
  return database
    .prepare("SELECT * FROM titles ORDER BY name, id")
    .all()
    .map((row) => {
      const title = decodeTitle(row);
      return { title, rounds: grouped.get(title.id) ?? [] };
    });
}

export function readTitle(
  database: DatabaseSync,
  id: string,
): ArchiveEntry | null {
  const row = database.prepare("SELECT * FROM titles WHERE id = ?").get(id);
  if (!row) return null;
  return {
    title: decodeTitle(row),
    rounds: database
      .prepare(
        "SELECT * FROM watch_rounds WHERE title_id = ? ORDER BY created_at DESC, id DESC",
      )
      .all(id)
      .map(decodeRound),
  };
}

export function createTitle(
  database: DatabaseSync,
  input: TitleInput,
  isDemo = false,
): string {
  const id = randomUUID();
  insertTitleRecord(database, {
    ...input,
    id,
    isDemo,
    createdAt: new Date().toISOString(),
  });
  return id;
}

/** Insert a validated snapshot while preserving its identity and timestamps. */
export function insertTitleRecord(database: DatabaseSync, input: Title): void {
  database
    .prepare(
      `INSERT INTO titles (id,name,original_title,category,release_year,genres,country,language,cover_url,backdrop_url,synopsis,runtime_minutes,total_episodes,is_demo,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(
      input.id,
      input.name,
      input.originalTitle,
      input.category,
      input.releaseYear,
      JSON.stringify(input.genres),
      input.country,
      input.language,
      input.coverUrl,
      input.backdropUrl,
      input.synopsis,
      input.runtimeMinutes,
      input.totalEpisodes,
      Number(input.isDemo),
      input.createdAt,
    );
}

export function updateTitle(
  database: DatabaseSync,
  id: string,
  input: TitleInput,
): void {
  transaction(database, () => {
    if (
      input.totalEpisodes !== null &&
      database
        .prepare(
          "SELECT id FROM watch_rounds WHERE title_id = ? AND episode > ? LIMIT 1",
        )
        .get(id, input.totalEpisodes)
    )
      throw new TitleRuleError(
        "จำนวนตอนใหม่น้อยกว่าความคืบหน้าที่บันทึกไว้ กรุณาแก้ความคืบหน้าก่อน",
      );
    const result = database
      .prepare(
        `UPDATE titles SET name=?,original_title=?,category=?,release_year=?,genres=?,country=?,language=?,cover_url=?,backdrop_url=?,synopsis=?,runtime_minutes=?,total_episodes=? WHERE id=?`,
      )
      .run(
        input.name,
        input.originalTitle,
        input.category,
        input.releaseYear,
        JSON.stringify(input.genres),
        input.country,
        input.language,
        input.coverUrl,
        input.backdropUrl,
        input.synopsis,
        input.runtimeMinutes,
        input.totalEpisodes,
        id,
      );
    if (!result.changes) throw new TitleRuleError("ไม่พบเรื่องนี้");
  });
}
