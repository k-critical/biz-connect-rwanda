// Runs the real auth configuration against the local database. Emails are captured in
// memory instead of being sent. Test accounts use a reserved domain and are deleted after.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailMessage } from "@/server/mail/templates";

const outbox = vi.hoisted(() => [] as EmailMessage[]);
vi.mock("@/server/mail/mailer", () => ({
  sendEmail: async (message: EmailMessage) => {
    outbox.push(message);
  },
  sendEmailInBackground: (message: EmailMessage) => {
    outbox.push(message);
  },
}));

const { auth } = await import("./auth");
const { db } = await import("@/server/db");

const DOMAIN = "auth-test.bizconnect.test";
const PASSWORD = "correct horse battery";
let counter = 0;
const newEmail = () => `person-${Date.now()}-${counter++}@${DOMAIN}`;

async function cleanUp() {
  await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
  await db.rateLimit.deleteMany({ where: { key: { contains: "203.0.113." } } });
}

async function errorCode(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return (error as { body?: { code?: string } }).body?.code ?? String(error);
  }
}

const lastEmailTo = (email: string) => outbox.filter((m) => m.to === email).at(-1);
const linkIn = (message: EmailMessage | undefined) =>
  new URL(message?.text.match(/https?:\/\/\S+/)?.[0] ?? "http://missing.invalid");

async function registerAndVerify(email: string) {
  await auth.api.signUpEmail({ body: { name: "Test Person", email, password: PASSWORD } });
  const token = linkIn(lastEmailTo(email)).searchParams.get("token")!;
  await auth.api.verifyEmail({ query: { token } });
}

beforeAll(cleanUp);
afterAll(async () => {
  await cleanUp();
  await db.$disconnect();
});
beforeEach(() => {
  outbox.length = 0;
});

describe("registration", () => {
  it("creates an unverified member and emails a confirmation link", async () => {
    const email = newEmail();
    await auth.api.signUpEmail({ body: { name: "Aline", email, password: PASSWORD } });

    const user = await db.user.findUnique({ where: { email } });
    expect(user).toMatchObject({ name: "Aline", emailVerified: false, role: "VISITOR" });

    const message = lastEmailTo(email);
    expect(message?.subject).toMatch(/Confirm your email/);
    expect(linkIn(message).pathname).toBe("/api/auth/verify-email");
  });

  it("stores passwords as Argon2id hashes, never in plain text", async () => {
    const email = newEmail();
    await auth.api.signUpEmail({ body: { name: "Hash Check", email, password: PASSWORD } });
    const account = await db.account.findFirst({ where: { user: { email } } });
    expect(account?.password).toMatch(/^\$argon2id\$/);
    expect(account?.password).not.toContain(PASSWORD);
  });

  it("doesn't let anyone choose their own role", async () => {
    const email = newEmail();
    await errorCode(
      auth.api.signUpEmail({
        body: { name: "Sneaky", email, password: PASSWORD, role: "ADMIN" } as never,
      }),
    );
    const user = await db.user.findUnique({ where: { email } });
    if (user) expect(user.role).toBe("VISITOR");
  });

  it("doesn't reveal that an email is already registered", async () => {
    const email = newEmail();
    await auth.api.signUpEmail({ body: { name: "First", email, password: PASSWORD } });
    outbox.length = 0;

    const secondAttempt = await errorCode(
      auth.api.signUpEmail({ body: { name: "Second", email, password: "another password" } }),
    );
    expect(secondAttempt).toBeNull();
    expect(await db.user.count({ where: { email } })).toBe(1);
    expect(lastEmailTo(email)?.subject).toMatch(/tried to register/);
  });
});

describe("signing in", () => {
  it("refuses to sign in before the email is confirmed", async () => {
    const email = newEmail();
    await auth.api.signUpEmail({ body: { name: "Waiting", email, password: PASSWORD } });
    expect(await errorCode(auth.api.signInEmail({ body: { email, password: PASSWORD } }))).toBe(
      "EMAIL_NOT_VERIFIED",
    );
  });

  it("signs in with the right password after confirming, and refuses a wrong one", async () => {
    const email = newEmail();
    await registerAndVerify(email);
    expect((await db.user.findUnique({ where: { email } }))?.emailVerified).toBe(true);

    expect(
      await errorCode(auth.api.signInEmail({ body: { email, password: "wrong password" } })),
    ).toBe("INVALID_EMAIL_OR_PASSWORD");
    const result = await auth.api.signInEmail({ body: { email, password: PASSWORD } });
    expect(result.user.email).toBe(email);
    expect(result.token).toBeTruthy();
  });

  it("blocks a sixth sign-in attempt within a minute from the same address", async () => {
    const ip = `203.0.113.${1 + Math.floor(Math.random() * 250)}`;
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await auth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": ip,
          },
          body: JSON.stringify({ email: `nobody@${DOMAIN}`, password: "wrong password" }),
        }),
      );
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5)).not.toContain(429);
    expect(statuses[5]).toBe(429);
  });
});

describe("password reset", () => {
  it("emails a link that sets a new password and retires the old one", async () => {
    const email = newEmail();
    await registerAndVerify(email);
    outbox.length = 0;

    await auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } });
    const link = linkIn(lastEmailTo(email));
    expect(link.pathname).toMatch(/^\/api\/auth\/reset-password\//);
    const token = link.pathname.split("/").at(-1)!;

    await auth.api.resetPassword({ body: { token, newPassword: "a brand new password" } });
    expect(await errorCode(auth.api.signInEmail({ body: { email, password: PASSWORD } }))).toBe(
      "INVALID_EMAIL_OR_PASSWORD",
    );
    const result = await auth.api.signInEmail({
      body: { email, password: "a brand new password" },
    });
    expect(result.user.email).toBe(email);
  });

  it("answers the same way for an unknown email, without sending anything", async () => {
    const email = newEmail();
    expect(
      await errorCode(
        auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } }),
      ),
    ).toBeNull();
    expect(lastEmailTo(email)).toBeUndefined();
  });

  it("won't reuse a reset link", async () => {
    const email = newEmail();
    await registerAndVerify(email);
    await auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } });
    const token = linkIn(lastEmailTo(email)).pathname.split("/").at(-1)!;
    await auth.api.resetPassword({ body: { token, newPassword: "first new password" } });
    expect(
      await errorCode(
        auth.api.resetPassword({ body: { token, newPassword: "second new password" } }),
      ),
    ).toBe("INVALID_TOKEN");
  });
});
