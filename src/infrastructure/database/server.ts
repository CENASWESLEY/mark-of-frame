import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { openDatabase } from "./connection";

const runtime = globalThis as typeof globalThis & {
  afterframeDatabase?: DatabaseSync;
};

export function getDatabase(): DatabaseSync {
  runtime.afterframeDatabase ??= openDatabase(
    // Persistent user data is provisioned at runtime and must never be traced into a server bundle.
    resolve(
      /* turbopackIgnore: true */ process.env.AFTERFRAME_DATABASE_PATH ??
        "data/afterframe.sqlite",
    ),
  );
  return runtime.afterframeDatabase;
}
