import "server-only";
import { db } from "@/server/db";

export async function pingDatabase(): Promise<void> {
  await db.query("SELECT 1");
}
