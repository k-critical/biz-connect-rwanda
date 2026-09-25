import "server-only";
import { PgBoss } from "pg-boss";
import { env } from "@/config/env";

/**
 * The job queue. pg-boss keeps jobs in their own `pgboss` schema in our PostgreSQL database,
 * so there's no extra service to run. A job is saved first and done afterwards; if doing it
 * fails (say the mail server is down), it's retried with growing gaps.
 */
export const QUEUES = {
  email: "email",
} as const;

const globalForBoss = globalThis as unknown as { boss?: Promise<PgBoss> };

async function createBoss(): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: "pgboss",
    max: 3,
    application_name: "bizconnect-jobs",
  });
  boss.on("error", (error) => console.error("[jobs]", error.message));
  await boss.start();
  await boss.createQueue(QUEUES.email, {
    retryLimit: 6,
    retryDelay: 30,
    retryBackoff: true,
    retryDelayMax: 60 * 60,
    expireInSeconds: 60,
    deleteAfterSeconds: 7 * 24 * 60 * 60,
  });
  return boss;
}

/** One queue connection per server process, reused across requests and hot reloads. */
export function getBoss(): Promise<PgBoss> {
  globalForBoss.boss ??= createBoss().catch((error: unknown) => {
    globalForBoss.boss = undefined;
    throw error;
  });
  return globalForBoss.boss;
}
