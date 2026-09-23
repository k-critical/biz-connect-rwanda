import "server-only";
import { Pool } from "pg";
import { env } from "@/config/env";

// Reuse one pool across hot reloads in development, otherwise each reload opens new connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const db =
  globalForDb.pgPool ??
  new Pool({ connectionString: env.DATABASE_URL, max: 5, connectionTimeoutMillis: 3000 });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = db;
