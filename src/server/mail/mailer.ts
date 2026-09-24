import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/config/env";
import type { EmailMessage } from "./templates";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
});

export async function sendEmail(message: EmailMessage): Promise<void> {
  await transport.sendMail({ from: env.MAIL_FROM, ...message });
}

/**
 * Sends without making the caller wait. Auth flows use this so that response times don't
 * reveal whether an email address has an account. Failures are logged, not thrown.
 */
export function sendEmailInBackground(message: EmailMessage): void {
  sendEmail(message).catch((error: unknown) => {
    console.error(
      `[mail] could not send "${message.subject}":`,
      error instanceof Error ? error.message : error,
    );
  });
}
