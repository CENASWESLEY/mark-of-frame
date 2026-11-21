import data from "../../scripts/demo-data.json";
import { titleInputSchema } from "@/modules/catalog/domain/title";
import { watchRoundInputSchema } from "@/modules/watching/domain/watch-round";
import {
  archiveBackupSchema,
  createArchiveBackup,
} from "@/modules/backup/domain/archive-backup";

// Fixed identities make deliberately loading these labeled samples idempotent.
const sampleId = (index: number) =>
  `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
export function sampleBackup() {
  return archiveBackupSchema.parse(
    createArchiveBackup(
      data.map((item, index) => {
        const id = sampleId(index + 1),
          episodic = ["anime", "series"].includes(item.category);
        const title = {
          ...titleInputSchema.parse({
            name: item.name,
            originalTitle: "",
            category:
              item.category === "animefilm" ? "anime-film" : item.category,
            releaseYear: item.year,
            genres: item.genres.split(" · ").join(", "),
            country: "",
            language: "",
            coverUrl: `/images/${item.id}.jpg`,
            backdropUrl: item.id === "interstellar" ? "/images/space.jpg" : "",
            synopsis: item.synopsis,
            runtimeMinutes: episodic
              ? ""
              : String(Number.parseInt(item.length, 10)),
            totalEpisodes:
              item.id === "attack" ? "25" : item.id === "saul" ? "10" : "",
          }),
          id,
          isDemo: true,
          createdAt: "2026-11-12T12:00:00.000Z",
        };
        const rounds = Array.from({ length: item.watches }, (_, number) => {
          const date = `${2026 - item.watches + 1 + number}-11-12`,
            last = number === item.watches - 1;
          return {
            ...watchRoundInputSchema.parse({
              titleId: id,
              status: "completed",
              score: (item.score - (last ? 0 : 0.35)).toFixed(2),
              season: "1",
              episode: "0",
              startedOn: date,
              finishedOn: date,
              note: last ? item.note : "บันทึกตัวอย่างจากการดูรอบก่อน",
            }),
            id: sampleId(1000 + index * 100 + number),
            createdAt: `${date}T12:00:00.000Z`,
            updatedAt: `${date}T12:00:00.000Z`,
          };
        });
        if (["attack", "saul"].includes(item.id))
          rounds.push({
            ...watchRoundInputSchema.parse({
              titleId: id,
              status: "watching",
              score: "",
              season: "1",
              episode: item.id === "attack" ? "18" : "6",
              startedOn: "2026-11-20",
              finishedOn: "",
              note: "ตัวอย่างรายการที่กำลังดูซ้ำ",
            }),
            id: sampleId(20000 + index),
            createdAt: "2026-11-20T12:00:00.000Z",
            updatedAt: "2026-11-20T12:00:00.000Z",
          });
        return { title, rounds };
      }),
    ),
  );
}
