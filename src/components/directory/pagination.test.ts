import { describe, expect, it } from "vitest";
import { visiblePages } from "./pagination";

describe("visiblePages", () => {
  it("shows every page when there are only a few", () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
  });

  it("keeps first, last and neighbours, with gaps marked", () => {
    expect(visiblePages(10, 40)).toEqual([1, null, 9, 10, 11, null, 40]);
    expect(visiblePages(2, 40)).toEqual([1, 2, 3, null, 40]);
  });
});
