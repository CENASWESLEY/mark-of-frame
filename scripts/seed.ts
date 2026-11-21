import { existsSync, readFileSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";
import { openDatabase } from "../src/infrastructure/database/connection";
import { createTitle } from "../src/modules/catalog/server/title-store";
import { saveRound } from "../src/modules/watching/server/watch-store";
import { titleInputSchema } from "../src/modules/catalog/domain/title";
import { watchRoundInputSchema } from "../src/modules/watching/domain/watch-round";
import { z } from "zod";

// Match Next's local-development precedence without coupling this tool to Next internals.
for (const filename of [".env.local", ".env"]) {
  if (existsSync(filename)) loadEnvFile(filename);
}

const demoSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    year: z.number(),
    score: z.number(),
    watches: z.number(),
    length: z.string(),
    genres: z.string(),
    note: z.string(),
    synopsis: z.string(),
  }),
);
const data = demoSchema.parse(
  JSON.parse(readFileSync(resolve("scripts/demo-data.json"), "utf8")),
);
const database = openDatabase(
  resolve(process.env.AFTERFRAME_DATABASE_PATH ?? "data/afterframe.sqlite"),
);
let added = 0;
try {
  for (const item of data) {
    if (
      database
        .prepare("SELECT id FROM titles WHERE name = ? AND is_demo = 1")
        .get(item.name)
    )
      continue;
    const category =
      item.category === "animefilm" ? "anime-film" : item.category;
    const episodic = ["anime", "series"].includes(category);
    const title = titleInputSchema.parse({
      name: item.name,
      originalTitle: "",
      category,
      releaseYear: String(item.year),
      genres: item.genres.split(" · ").join(", "),
      country: "",
      language: "",
      coverUrl: `/images/${item.id}.jpg`,
      backdropUrl: item.id === "interstellar" ? "/images/space.jpg" : "",
      synopsis: item.synopsis,
      runtimeMinutes: episodic ? "" : String(Number.parseInt(item.length, 10)),
      totalEpisodes:
        item.id === "attack" ? "25" : item.id === "saul" ? "10" : "",
    });
    const id = createTitle(database, title, true);
    for (let round = 0; round < item.watches; round++) {
      const last = round === item.watches - 1;
      const date = `${2026 - (item.watches - 1 - round)}-11-12`;
      saveRound(
        database,
        watchRoundInputSchema.parse({
          titleId: id,
          status: "completed",
          score: (item.score - (last ? 0 : 0.35)).toFixed(2),
          season: "1",
          episode: "0",
          startedOn: date,
          finishedOn: date,
          note: last
            ? item.note
            : "ครั้งนั้นชอบเรื่องนี้มาก วันนี้อยากกลับมาดูอีกครั้ง เผื่อจะพบรายละเอียดที่เคยมองข้ามไป",
        }),
      );
    }
    if (["attack", "saul"].includes(item.id)) {
      saveRound(
        database,
        watchRoundInputSchema.parse({
          titleId: id,
          status: "watching",
          score: "",
          season: item.id === "saul" ? "3" : "1",
          episode: item.id === "attack" ? "18" : "6",
          startedOn: "2026-11-20",
          finishedOn: "",
          note: "กลับมาดูอีกครั้ง ค่อย ๆ เก็บรายละเอียดระหว่างทาง",
        }),
      );
    }
    added++;
  }
  console.log(
    `Added ${added} labeled demo titles. Existing data was preserved.`,
  );
} finally {
  database.close();
}
