import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { migrations } from "./migrations";

export function openDatabase(filename: string): DatabaseSync {
  if (filename !== ":memory:")
    mkdirSync(dirname(resolve(filename)), { recursive: true });
  const database = new DatabaseSync(filename);
  database.exec(
    "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
  );
  database.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY) STRICT",
  );
  for (const migration of migrations) {
    database.exec("BEGIN IMMEDIATE");
    try {
      if (
        !database
          .prepare("SELECT version FROM schema_migrations WHERE version = ?")
          .get(migration.version)
      ) {
        database.exec(migration.sql);
        database
          .prepare("INSERT INTO schema_migrations (version) VALUES (?)")
          .run(migration.version);
      }
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      database.close();
      throw error;
    }
  }
  return database;
}

export function transaction<T>(database: DatabaseSync, operation: () => T): T {
  const savepoint = database.isTransaction
    ? `afterframe_${randomUUID().replaceAll("-", "")}`
    : null;
  database.exec(savepoint ? `SAVEPOINT ${savepoint}` : "BEGIN IMMEDIATE");
  try {
    const result = operation();
    database.exec(savepoint ? `RELEASE SAVEPOINT ${savepoint}` : "COMMIT");
    return result;
  } catch (error) {
    database.exec(
      savepoint
        ? `ROLLBACK TO SAVEPOINT ${savepoint}; RELEASE SAVEPOINT ${savepoint}`
        : "ROLLBACK",
    );
    throw error;
  }
}
