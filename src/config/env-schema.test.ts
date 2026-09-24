import { describe, expect, it } from "vitest";
import { parseEnv } from "./env-schema";

const valid = {
  DATABASE_URL: "postgresql://bizconnect:secret@localhost:5432/bizconnect",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "a".repeat(32),
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  MAIL_FROM: "BizConnect Rwanda <no-reply@bizconnect.local>",
};

describe("parseEnv", () => {
  it("accepts a complete configuration and converts types", () => {
    const env = parseEnv(valid);
    expect(env.SMTP_PORT).toBe(1025);
    expect(env.SMTP_SECURE).toBe(false);
    expect(parseEnv({ ...valid, SMTP_SECURE: "true" }).SMTP_SECURE).toBe(true);
  });

  it("rejects a missing DATABASE_URL and names it in the error", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("rejects a database URL that is not PostgreSQL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "mysql://u:p@localhost:3306/db" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("rejects a port that is not a number", () => {
    expect(() => parseEnv({ ...valid, SMTP_PORT: "mail" })).toThrow(/SMTP_PORT/);
  });

  it("rejects an auth secret that is too short to be safe", () => {
    expect(() => parseEnv({ ...valid, BETTER_AUTH_SECRET: "short" })).toThrow(/BETTER_AUTH_SECRET/);
  });
});
