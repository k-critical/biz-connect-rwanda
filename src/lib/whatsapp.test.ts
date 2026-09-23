import { describe, expect, it } from "vitest";
import { whatsappLink } from "./whatsapp";

describe("whatsappLink", () => {
  it("keeps only the digits of an international number", () => {
    expect(whatsappLink("+250 788 123 456", "Hi")).toBe("https://wa.me/250788123456?text=Hi");
  });

  it("encodes the greeting so spaces and punctuation survive", () => {
    expect(whatsappLink("+250788123456", "Hello! Are you open?")).toBe(
      "https://wa.me/250788123456?text=Hello!%20Are%20you%20open%3F",
    );
  });

  it("refuses a number that is too short to be real", () => {
    expect(() => whatsappLink("12-34")).toThrow(/Not a usable phone number/);
  });
});
