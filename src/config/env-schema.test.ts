import { describe, expect, it } from "vitest";
import { parseEnv } from "./env-schema";

const valid = {
  DATABASE_URL: "postgresql://bizconnect:secret@localhost:5432/bizconnect",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("accepts a complete configuration and turns the port into a number", () => {
    expect(parseEnv(valid).SMTP_PORT).toBe(1025);
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
});
