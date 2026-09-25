import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalFileStorage, isValidStorageKey } from "./local-file-storage";

let root: string;
let storage: LocalFileStorage;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "bizconnect-storage-"));
  storage = new LocalFileStorage(root);
});
afterAll(() => rm(root, { recursive: true, force: true }));

describe("LocalFileStorage", () => {
  it("saves, reads and deletes files", async () => {
    const key = "public/businesses/abc/photo-1-sm.webp";
    await storage.put(key, Buffer.from("hello"));
    expect((await storage.get(key))?.toString()).toBe("hello");

    await storage.delete([key]);
    expect(await storage.get(key)).toBeNull();
  });

  it("treats deleting a missing file as done", async () => {
    await expect(
      storage.delete(["public/businesses/abc/missing-sm.webp"]),
    ).resolves.toBeUndefined();
  });

  it("refuses keys that could reach outside its folder", async () => {
    for (const key of [
      "../outside.webp",
      "public/../../outside.webp",
      "/etc/passwd.webp",
      "public\\..\\outside.webp",
      "public/businesses/ABC.webp",
      "public/businesses/abc.exe",
      "other/abc.webp",
    ]) {
      expect(isValidStorageKey(key), key).toBe(false);
      await expect(storage.put(key, Buffer.from("x")), key).rejects.toThrow(/Invalid storage key/);
    }
    expect(await readdir(root)).not.toContain("outside.webp");
  });
});
