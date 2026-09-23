import { describe, expect, it } from "vitest";
import { displayHost, safeExternalUrl, telHref } from "./safe-links";

describe("safeExternalUrl", () => {
  it("allows ordinary web links", () => {
    expect(safeExternalUrl("https://example.rw/menu")).toBe("https://example.rw/menu");
    expect(safeExternalUrl("http://example.rw")).toBe("http://example.rw/");
  });

  it("blocks script and other non-web links", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("JavaScript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
  });
});

describe("telHref and displayHost", () => {
  it("strips spaces and dashes from phone links", () => {
    expect(telHref("+250 788-123 456")).toBe("tel:+250788123456");
  });

  it("shows a short host name", () => {
    expect(displayHost("https://www.example.rw/menu")).toBe("example.rw");
  });
});
