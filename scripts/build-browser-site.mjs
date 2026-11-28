import { build } from "vite";
import { resolve } from "node:path";
const root = process.cwd();
// Explicit target adapters reuse the approved UI and pure domains, while preventing
// Next's server actions, SQLite, and runtime from entering the static Sites bundle.
await build({
  configFile: false,
  root,
  // Relative assets let the same static build work at / and /mark-of-frame/.
  base: "./",
  publicDir: resolve(root, "public"),
  resolve: {
    alias: [
      {
        find: "next/link",
        replacement: resolve(root, "src/site/navigation.tsx"),
      },
      {
        find: "next/navigation",
        replacement: resolve(root, "src/site/navigation.tsx"),
      },
      {
        find: "../server/actions",
        replacement: resolve(root, "src/site/actions.ts"),
      },
      { find: "@", replacement: resolve(root, "src") },
    ],
  },
  plugins: [
    {
      name: "browser-storage-boundary",
      generateBundle() {
        for (const id of this.getModuleIds()) {
          const path = id.replaceAll("\\", "/");
          if (
            /\/src\/(infrastructure\/|modules\/[^/]+\/server\/)/.test(path) ||
            path.includes("node:sqlite")
          )
            this.error(`Server persistence entered the static bundle: ${path}`);
        }
      },
    },
  ],
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    rolldownOptions: {
      onwarn(warning, report) {
        // The static target is entirely client-side, so shared UI RSC markers are redundant.
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" &&
          warning.message.includes('"use client"')
        )
          return;
        report(warning);
      },
    },
  },
});
