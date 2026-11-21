import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const images = JSON.parse(
  await readFile(resolve(root, "public/images/sources.json"), "utf8"),
);
await mkdir(resolve(root, "public/fonts"), { recursive: true });
await Promise.all(
  Object.entries(images).map(async ([name, url]) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Image ${name}: ${response.status}`);
    await writeFile(
      resolve(root, `public/images/${name}.jpg`),
      Buffer.from(await response.arrayBuffer()),
    );
  }),
);
let css = await fetch(
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Sans+Thai:wght@400;500;600&display=swap",
  {
    headers: { "User-Agent": "Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36" },
  },
).then((response) => response.text());
const fonts = [
  ...new Set(
    [...css.matchAll(/url\((https:\/\/fonts.gstatic.com\/[^)]+)\)/g)].map(
      (match) => match[1],
    ),
  ),
];
if (fonts.length === 0) throw new Error("No font files returned");
await Promise.all(
  fonts.map(async (url, index) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Font download: ${response.status}`);
    const extension = url.endsWith(".woff2") ? "woff2" : "ttf";
    const name = `afterframe-${index}.${extension}`;
    await writeFile(
      resolve(root, "public/fonts", name),
      Buffer.from(await response.arrayBuffer()),
    );
    css = css.split(url).join(`/fonts/${name}`);
  }),
);
await writeFile(
  resolve(root, "src/app/fonts.css"),
  `/* Self-hosted Google Fonts, SIL Open Font License. */\n${css}`,
);
await Promise.all(
  ["cormorantgaramond", "notosansthai"].map(async (font) => {
    const response = await fetch(
      `https://raw.githubusercontent.com/google/fonts/main/ofl/${font}/OFL.txt`,
    );
    if (!response.ok)
      throw new Error(`Font license ${font}: ${response.status}`);
    await writeFile(
      resolve(root, "public/fonts", `${font}-OFL.txt`),
      await response.text(),
    );
  }),
);
console.log(
  `Prepared ${Object.keys(images).length} images and ${fonts.length} self-hosted font files.`,
);
await import("./add-rank-font.mjs");
