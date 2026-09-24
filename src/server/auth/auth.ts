import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/config/env";
import { ROLES } from "@/lib/roles";
import { db } from "@/server/db";
import { sendEmailInBackground } from "@/server/mail/mailer";
import {
  existingAccountEmail,
  resetPasswordEmail,
  verificationEmail,
} from "@/server/mail/templates";

// OWASP's recommended Argon2id settings: 19 MiB of memory, 2 iterations, 1 lane.
// Argon2id is the library's default algorithm; the auth tests check stored hashes use it.
const argon2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const minutes = (n: number) => n * 60;
const hours = (n: number) => n * 60 * 60;
const days = (n: number) => n * 24 * 60 * 60;

export const auth = betterAuth({
  appName: "BizConnect Rwanda",
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  advanced: {
    // Let Postgres/Prisma create the UUIDs, like every other table.
    database: { generateId: false },
    cookiePrefix: "bizconnect",
  },

  user: {
    additionalFields: {
      role: { type: [...ROLES], required: false, defaultValue: "VISITOR", input: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // With sign-in required after verification, registering an email that already exists
    // looks exactly like a normal sign-up, so the form can't be used to find accounts.
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: hours(1),
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: (password) => hash(password, argon2),
      verify: ({ hash: stored, password }) => verify(stored, password),
    },
    sendResetPassword: async ({ user, url }) => {
      sendEmailInBackground(resetPasswordEmail(user, url));
    },
    onExistingUserSignUp: async ({ user }) => {
      sendEmailInBackground(existingAccountEmail(user, env.NEXT_PUBLIC_SITE_URL));
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: days(1),
    sendVerificationEmail: async ({ user, url }) => {
      sendEmailInBackground(verificationEmail(user, url));
    },
  },

  session: {
    expiresIn: days(30),
    updateAge: days(1),
    // Reads the session from a signed cookie for up to 5 minutes instead of the database.
    // Role checks for admin pages bypass this cache (see requireRole).
    cookieCache: { enabled: true, maxAge: minutes(5) },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: hours(1), max: 10 },
      "/request-password-reset": { window: minutes(15), max: 3 },
      "/send-verification-email": { window: minutes(15), max: 3 },
      "/reset-password": { window: minutes(15), max: 5 },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
