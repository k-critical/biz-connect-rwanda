// Runs the real job queue (pg-boss) against the local database. Sending is replaced by an
// in-memory outbox, so no email leaves the machine.
import { afterAll, describe, expect, it, vi } from "vitest";
import type { EmailMessage } from "@/server/mail/templates";

const outbox = vi.hoisted(() => [] as EmailMessage[]);
vi.mock("@/server/mail/mailer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/mail/mailer")>()),
  sendEmail: async (message: EmailMessage) => {
    outbox.push(message);
  },
}));

const { queueEmail } = await import("@/server/mail/mailer");
const { startWorkers } = await import("./workers");
const { getBoss } = await import("./boss");

afterAll(async () => {
  await (await getBoss()).stop({ graceful: false });
});

describe("email queue", () => {
  it("stores an email as a job, and the worker sends it", async () => {
    await startWorkers();
    const message: EmailMessage = {
      to: `queue-test-${Date.now()}@queue-test.bizconnect.test`,
      subject: "Queue test",
      text: "Hello",
      html: "<p>Hello</p>",
    };
    await queueEmail(message);

    await vi.waitFor(() => expect(outbox).toContainEqual(message), {
      timeout: 15_000,
      interval: 250,
    });
  });
});
