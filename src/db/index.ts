import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import path from "path";

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), "wuf.db");

// Use a global singleton to avoid multiple connections during hot reload and build workers
const globalForDb = globalThis as unknown as { __wufDb?: ReturnType<typeof drizzle> };

function createDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export const db = globalForDb.__wufDb ?? (globalForDb.__wufDb = createDb());
