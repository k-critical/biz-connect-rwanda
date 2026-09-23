import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/config/env";

// Reuse one client across hot reloads in development, otherwise each reload opens new connections.
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForDb.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 3000,
    }),
  });

if (process.env.NODE_ENV !== "production") globalForDb.prisma = db;
