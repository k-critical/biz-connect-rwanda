import { describe, expect, it } from "vitest";
import { existingAccountEmail, resetPasswordEmail, verificationEmail } from "./templates";

const user = { email: "aline@example.rw", name: "Aline" };

describe("email templates", () => {
  it("puts the link in both the text and HTML versions", () => {
    const url = "http://localhost:3000/api/auth/verify-email?token=abc&callbackURL=%2Fx";
    const message = verificationEmail(user, url);
    expect(message.to).toBe("aline@example.rw");
    expect(message.text).toContain(url);
    expect(message.html).toContain(url.replace(/&/g, "&amp;"));
  });

  it("escapes names so they can't inject HTML", () => {
    const message = resetPasswordEmail(
      { ...user, name: "<script>alert(1)</script>" },
      "http://x/y",
    );
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
  });

  it("points an existing user to the sign-in page", () => {
    const message = existingAccountEmail(user, "https://bizconnect.rw");
    expect(message.text).toContain("https://bizconnect.rw/login");
  });
});
