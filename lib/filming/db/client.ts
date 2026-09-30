import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/filming/db/schema";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { filmingDb?: Database };

/** Lazily connects so importing this module never requires DATABASE_URL. */
export function getDb(): Database {
  if (globalForDb.filmingDb) return globalForDb.filmingDb;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const db = drizzle(postgres(url, { max: 5 }), { schema });
  globalForDb.filmingDb = db;
  return db;
}
