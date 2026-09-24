import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-errors";
import { hasRole } from "./roles";

describe("hasRole", () => {
  it("lets higher roles do what lower roles can", () => {
    expect(hasRole("ADMIN", "OWNER")).toBe(true);
    expect(hasRole("OWNER", "OWNER")).toBe(true);
    expect(hasRole("VISITOR", "VISITOR")).toBe(true);
  });

  it("keeps lower roles out", () => {
    expect(hasRole("VISITOR", "ADMIN")).toBe(false);
    expect(hasRole("OWNER", "ADMIN")).toBe(false);
  });

  it("treats missing or unknown roles as no access", () => {
    expect(hasRole(null, "VISITOR")).toBe(false);
    expect(hasRole(undefined, "VISITOR")).toBe(false);
    expect(hasRole("SUPERUSER", "VISITOR")).toBe(false);
    expect(hasRole("toString", "VISITOR")).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("explains known errors in plain words", () => {
    expect(authErrorMessage({ code: "EMAIL_NOT_VERIFIED" })).toMatch(/confirm your email/);
    expect(authErrorMessage({ status: 429 })).toMatch(/Too many attempts/);
  });

  it("falls back to a general message", () => {
    expect(authErrorMessage({ code: "SOMETHING_NEW" })).toMatch(/Something went wrong/);
    expect(authErrorMessage(null)).toMatch(/Something went wrong/);
  });
});
