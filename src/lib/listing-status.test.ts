import { describe, expect, it } from "vitest";
import {
  canChangeSlug,
  canDeleteListing,
  canEditListing,
  canSubmitListing,
  isReadyToSubmit,
  listingChecklist,
} from "./listing-status";

const bare = {
  whatsapp: null,
  phone: null,
  email: null,
  latitude: null,
  hoursCount: 0,
  photoCount: 0,
  showcaseCount: 0,
};

describe("listing checklist", () => {
  it("only needs a way to get in touch before sending", () => {
    expect(isReadyToSubmit(listingChecklist(bare))).toBe(false);
    expect(isReadyToSubmit(listingChecklist({ ...bare, email: "a@b.rw" }))).toBe(true);
  });

  it("marks what's done", () => {
    const done = listingChecklist({
      ...bare,
      whatsapp: "+250788123456",
      latitude: -1.9,
      hoursCount: 7,
      photoCount: 3,
      showcaseCount: 1,
    });
    expect(done.every((item) => item.done)).toBe(true);
  });
});

describe("what owners may do in each status", () => {
  it.each([
    ["DRAFT", true, true, true, true],
    ["PENDING", true, false, false, true],
    ["APPROVED", true, false, false, false],
    ["REJECTED", true, true, true, true],
    ["SUSPENDED", false, false, false, false],
  ] as const)("%s", (status, edit, submit, remove, slug) => {
    expect(canEditListing(status)).toBe(edit);
    expect(canSubmitListing(status)).toBe(submit);
    expect(canDeleteListing(status)).toBe(remove);
    expect(canChangeSlug(status)).toBe(slug);
  });
});
