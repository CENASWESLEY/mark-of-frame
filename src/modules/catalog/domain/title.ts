import { z } from "zod";

export const categories = [
  { id: "film", label: "ภาพยนตร์" },
  { id: "anime", label: "อนิเมะ" },
  { id: "series", label: "ซีรีส์" },
  { id: "anime-film", label: "หนังอนิเมะ" },
  { id: "animated-film", label: "หนังแอนิเมชัน" },
  { id: "animated-series", label: "ซีรีส์แอนิเมชัน" },
  { id: "documentary", label: "สารคดีภาพยนตร์" },
  { id: "documentary-series", label: "สารคดีแบบตอน" },
  { id: "short", label: "หนังสั้น" },
] as const;

export type Category = (typeof categories)[number]["id"];
export const categorySchema = z.enum(categories.map((category) => category.id));
export const categoryLabel = (id: Category) =>
  categories.find((category) => category.id === id)?.label ?? id;
export const isEpisodic = (id: Category) =>
  ["anime", "series", "animated-series", "documentary-series"].includes(id);
export const categoryEnglishLabel = (id: Category) =>
  ({
    film: "Films",
    anime: "Anime",
    series: "Series",
    "anime-film": "Anime Films",
    "animated-film": "Animated Films",
    "animated-series": "Animated Series",
    documentary: "Documentaries",
    "documentary-series": "Documentary Series",
    short: "Short Films",
  })[id];

const optionalInteger = (maximum: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? null : Number(value)),
    z.number().int().min(1).max(maximum).nullable(),
  );

const imageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (value === "") return true;
    if (/^\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(value)) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "ใช้ URL รูปภาพแบบ https://");

export const titleInputSchema = z.object({
  name: z.string().trim().min(1, "กรอกชื่อเรื่อง").max(200),
  originalTitle: z.string().trim().max(200),
  category: categorySchema,
  releaseYear: optionalInteger(2200),
  genres: z
    .string()
    .max(500)
    .transform((value) =>
      [
        ...new Set(
          value
            .split(",")
            .map((genre) => genre.trim())
            .filter(Boolean),
        ),
      ].slice(0, 20),
    ),
  country: z.string().trim().max(100),
  language: z.string().trim().max(100),
  coverUrl: imageUrl,
  backdropUrl: imageUrl,
  synopsis: z.string().trim().max(5000),
  runtimeMinutes: optionalInteger(10000),
  totalEpisodes: optionalInteger(100000),
});

export type TitleInput = z.output<typeof titleInputSchema>;
export type Title = TitleInput & {
  id: string;
  isDemo: boolean;
  createdAt: string;
};
