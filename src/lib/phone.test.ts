import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["0788 123 456", "+250788123456"],
    ["0788123456", "+250788123456"],
    ["788123456", "+250788123456"],
    ["250788123456", "+250788123456"],
    ["+250 788-123-456", "+250788123456"],
    ["(+250) 788 123 456", "+250788123456"],
    ["00250788123456", "+250788123456"],
    ["0252 123 456", "+250252123456"],
    ["+254 712 345 678", "+254712345678"],
    ["0044 20 7946 0958", "+442079460958"],
  ])("reads %s as %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "12345",
    "0588 123 456", // Rwandan numbers start with 7 or 2 after the 0
    "+250 788 123 45", // one digit short
    "call me",
    "0788 123 456 ext 2",
    "+250+788123456",
    "+0 123 456 789",
  ])("rejects %j", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("groups Rwandan numbers for reading", () => {
    expect(formatPhone("+250788123456")).toBe("+250 788 123 456");
  });

  it("leaves other numbers as stored", () => {
    expect(formatPhone("+254712345678")).toBe("+254712345678");
  });
});
