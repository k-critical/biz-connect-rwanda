import "server-only";
import type { EmailMessage } from "@/server/mail/templates";
import { sendEmail } from "@/server/mail/mailer";
import { QUEUES, getBoss } from "./boss";

const globalForWorkers = globalThis as unknown as { workersStarted?: boolean };

/** Starts the background workers. Called once when the web server starts (instrumentation.ts). */
export async function startWorkers(): Promise<void> {
  if (globalForWorkers.workersStarted) return;
  globalForWorkers.workersStarted = true;

  const boss = await getBoss();
  await boss.work<EmailMessage>(QUEUES.email, async ([job]) => {
    if (job) await sendEmail(job.data);
  });

  const stop = () => void boss.stop({ graceful: true, timeout: 10_000 });
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  console.log("[jobs] email worker started");
}
