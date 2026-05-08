import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Support standard Supabase PostgreSQL connection strings along with Vercel fallbacks
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is not fully provided yet. Please ensure your Supabase Postgres connection string is loaded.");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl || "postgresql://postgres:postgres@localhost:5432/postgres",
    ssl: databaseUrl && (databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) 
      ? false 
      : { rejectUnauthorized: false }
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
