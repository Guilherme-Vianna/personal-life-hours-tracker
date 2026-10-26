import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

function createDb(url: string): Database {
  // Neon's HTTP driver only talks to Neon; a plain Postgres (docker compose) goes through node-postgres.
  if (new URL(url).hostname.endsWith(".neon.tech")) return drizzleNeon(neon(url), { schema }) as unknown as Database;
  return drizzlePg(url, { schema }) as unknown as Database;
}

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada. Copie .env.example para .env.local.");
  // The dev cache survives hot reloads, so it is keyed by URL to pick up DATABASE_URL changes.
  const cache = globalThis as unknown as { dbCache?: { url: string; db: Database } };
  if (cache.dbCache?.url !== url) cache.dbCache = { url, db: createDb(url) };
  return cache.dbCache.db;
}

export const db = getDb();
