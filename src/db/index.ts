import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "../env";
import * as schema from "./schema";

// Ensure the data directory exists before opening the database file
const resolvedPath = path.resolve(process.cwd(), env.DATABASE_PATH);
const dataDir = path.dirname(resolvedPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const sqlite = new Database(resolvedPath);

// Sensible SQLite pragmas for a single-server bot workload
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
