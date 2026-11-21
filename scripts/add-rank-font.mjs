import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const cssPath = resolve(root, "src/app/fonts.css");
const previous = await readFile(cssPath, "utf8");
if (!previous.includes("Racing Sans One")) {
  const response = await fetch(
    "https://fonts.googleapis.com/css2?family=Racing+Sans+One&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36" } },
  );
  if (!response.ok) throw new Error(`Font CSS: ${response.status}`);
  let css = await response.text();
  const urls = [
    ...new Set(
      [...css.matchAll(/url\((https:\/\/fonts.gstatic.com\/[^)]+)\)/g)].map(
        (match) => match[1],
      ),
    ),
  ];
  if (!urls.length) throw new Error("Missing rank font files");
  for (const [index, url] of urls.entries()) {
    const file = await fetch(url);
    if (!file.ok) throw new Error(`Rank font: ${file.status}`);
    const name = `rank-${index}.${url.endsWith(".woff2") ? "woff2" : "ttf"}`;
    await writeFile(
      resolve(root, "public/fonts", name),
      Buffer.from(await file.arrayBuffer()),
    );
    css = css.split(url).join(`/fonts/${name}`);
  }
  const license = await fetch(
    "https://raw.githubusercontent.com/google/fonts/main/ofl/racingsansone/OFL.txt",
  );
  if (!license.ok) throw new Error(`Rank font license: ${license.status}`);
  await writeFile(
    resolve(root, "public/fonts/racingsansone-OFL.txt"),
    await license.text(),
  );
  await writeFile(
    cssPath,
    `${previous}\n/* Racing Sans One — rank lettering, SIL OFL. */\n${css}`,
  );
  console.log(`Added ${urls.length} local rank font files.`);
} else console.log("Rank font is already present.");
