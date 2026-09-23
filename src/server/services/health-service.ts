import "server-only";
import net from "node:net";
import { env } from "@/config/env";
import { pingDatabase } from "@/server/repositories/health-repository";

export type CheckStatus = "up" | "down";

export type HealthReport = {
  status: "ok" | "degraded";
  checks: { database: CheckStatus; mail: CheckStatus };
};

async function runCheck(name: string, probe: () => Promise<void>): Promise<CheckStatus> {
  try {
    await probe();
    return "up";
  } catch (error) {
    console.warn(`[health] ${name} check failed:`, error instanceof Error ? error.message : error);
    return "down";
  }
}

function probeSmtp(): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: env.SMTP_HOST, port: env.SMTP_PORT });
    socket.setTimeout(2000);
    socket.once("connect", () => {
      socket.end();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error(`no answer from ${env.SMTP_HOST}:${env.SMTP_PORT} within 2s`));
    });
    socket.once("error", reject);
  });
}

export async function getHealthReport(): Promise<HealthReport> {
  const [database, mail] = await Promise.all([
    runCheck("database", pingDatabase),
    runCheck("mail", probeSmtp),
  ]);
  return {
    status: database === "up" && mail === "up" ? "ok" : "degraded",
    checks: { database, mail },
  };
}
