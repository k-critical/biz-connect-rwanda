import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { QUEUES, getBoss } from "@/server/jobs/boss";
import type { EmailMessage } from "./templates";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
});

/** Sends right now. Only the email worker calls this; everything else uses queueEmail. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  await transport.sendMail({ from: env.MAIL_FROM, ...message });
}

/**
 * Puts an email in the job queue, where the worker sends it and retries if the mail server is
 * down. Never throws and returns quickly, so auth responses don't reveal whether an address
 * has an account. If the queue itself can't be reached, it tries to send straight away.
 */
export async function queueEmail(message: EmailMessage): Promise<void> {
  try {
    const boss = await getBoss();
    await boss.send(QUEUES.email, message);
  } catch (error) {
    console.error(
      `[mail] could not queue "${message.subject}", sending directly:`,
      error instanceof Error ? error.message : error,
    );
    await sendEmail(message).catch((sendError: unknown) => {
      console.error(
        `[mail] could not send "${message.subject}":`,
        sendError instanceof Error ? sendError.message : sendError,
      );
    });
  }
}
