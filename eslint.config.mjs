import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "next-env.d.ts",
    "data/**",
    ".verification/**",
    "dist/**",
    ".sites-runtime/**",
    "outputs/**",
  ]),
  {
    files: ["src/modules/**/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "next/*",
            "react",
            "@/app/*",
            "@/infrastructure/*",
            "@/modules/*/server/*",
            "@/modules/*/ui/*",
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
]);
