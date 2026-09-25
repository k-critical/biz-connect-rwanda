// Runs the owner and claim services against the local database (seeded with `npm run db:seed`).
// Test people use a reserved email domain and are deleted afterwards, with their listings.
// Uploaded files go to a temporary folder (see vitest.config.mts). Emails are captured.
import { rm } from "node:fs/promises";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailMessage } from "@/server/mail/templates";

const outbox = vi.hoisted(() => [] as EmailMessage[]);
vi.mock("@/server/mail/mailer", () => ({
  sendEmail: async (message: EmailMessage) => {
    outbox.push(message);
  },
  sendEmailInBackground: (message: EmailMessage) => {
    outbox.push(message);
  },
}));

const { db } = await import("@/server/db");
const { env } = await import("@/config/env");
const { storage } = await import("@/server/storage");
const { photoFileKey } = await import("@/lib/media");
const { getBusinessProfile } = await import("./directory-service");
const listings = await import("./listing-service");
const claims = await import("./claim-service");

const DOMAIN = "owner-test.bizconnect.test";
let counter = 0;

async function newPerson(name = "Test Owner") {
  const user = await db.user.create({
    data: { name, email: `person-${Date.now()}-${counter++}@${DOMAIN}`, emailVerified: true },
  });
  return { id: user.id, name: user.name, email: user.email };
}

async function cleanUp() {
  const where = { owner: { email: { endsWith: `@${DOMAIN}` } } };
  await db.business.deleteMany({ where });
  await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } });
}

const details = (overrides: Record<string, unknown> = {}) => ({
  name: "Test Brochette Corner",
  tagline: "Goat brochettes and fresh juice",
  description: "A small family grill near the market, open late. Cash and MoMo accepted.",
  category: "restaurants",
  extraCategories: ["entertainment"],
  district: "gasabo",
  priceLevel: "1",
  ...overrides,
});

const contact = (overrides: Record<string, string> = {}) => ({
  sector: "Kimironko",
  address: "",
  latitude: "-1.9441",
  longitude: "30.1270",
  whatsapp: "0788 123 456",
  phone: "",
  email: "",
  website: "",
  facebookUrl: "",
  instagramUrl: "",
  ...overrides,
});

async function start(owner: { id: string; name: string; email: string }, overrides = {}) {
  const result = await listings.startListing(owner, details(overrides));
  if (!result.ok) throw new Error(result.message);
  return result.value.id;
}

const photoBlob = async (width = 1200, height = 900) =>
  new Blob([
    new Uint8Array(
      await sharp({ create: { width, height, channels: 3, background: "#f4a823" } })
        .jpeg()
        .toBuffer(),
    ),
  ]);

beforeAll(cleanUp);
afterAll(async () => {
  await cleanUp();
  // Only ever remove the temporary test folder, never a real uploads folder.
  if (env.UPLOADS_DIR.includes("bizconnect-test-uploads")) {
    await rm(env.UPLOADS_DIR, { recursive: true, force: true });
  }
  await db.$disconnect();
});
beforeEach(() => {
  outbox.length = 0;
});

describe("starting a listing", () => {
  it("saves a private draft and makes its creator an owner", async () => {
    const owner = await newPerson();
    const id = await start(owner);

    const business = await listings.getOwnedListing(owner.id, id);
    expect(business).toMatchObject({
      status: "DRAFT",
      name: "Test Brochette Corner",
      slug: expect.stringMatching(/^test-brochette-corner/),
      priceLevel: 1,
      isDemo: false,
    });
    expect(business?.categories.map((c) => c.category.slug)).toEqual([
      "restaurants",
      "entertainment",
    ]);
    expect((await db.user.findUnique({ where: { id: owner.id } }))?.role).toBe("OWNER");
    expect(await getBusinessProfile(business!.slug)).toBeNull();
  });

  it("gives listings with the same name different addresses", async () => {
    const owner = await newPerson();
    const [a, b] = [
      await start(owner, { name: "Test Twin Salon" }),
      await start(owner, { name: "Test Twin Salon" }),
    ];
    const [first, second] = await Promise.all([
      listings.getOwnedListing(owner.id, a),
      listings.getOwnedListing(owner.id, b),
    ]);
    expect(first?.slug).not.toBe(second?.slug);
  });

  it("explains what's wrong instead of saving", async () => {
    const owner = await newPerson();
    const result = await listings.startListing(owner, details({ name: "", district: "atlantis" }));
    expect(result).toMatchObject({ ok: false, fieldErrors: { name: expect.any(String) } });

    const unknownDistrict = await listings.startListing(owner, details({ district: "atlantis" }));
    expect(unknownDistrict).toMatchObject({
      ok: false,
      fieldErrors: { district: expect.any(String) },
    });
    expect(await db.business.count({ where: { ownerId: owner.id } })).toBe(0);
  });

  it("doesn't turn an admin into an owner", async () => {
    const admin = await newPerson("Test Admin");
    await db.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
    await start(admin);
    expect((await db.user.findUnique({ where: { id: admin.id } }))?.role).toBe("ADMIN");
  });
});

describe("only the owner can see or change a listing", () => {
  it("hides it from everyone else", async () => {
    const owner = await newPerson();
    const stranger = await newPerson("Stranger");
    const id = await start(owner);

    expect(await listings.getOwnedListing(stranger.id, id)).toBeNull();
    expect(await listings.getOwnedListing(owner.id, "not-a-uuid")).toBeNull();

    const attempts = await Promise.all([
      listings.saveDetails(stranger, id, details({ name: "Hijacked" })),
      listings.saveContact(stranger, id, contact()),
      listings.saveHours(stranger, id, "[]"),
      listings.saveShowcase(stranger, id, "[]"),
      listings.addPhoto(stranger, id, await photoBlob(), ""),
      listings.submitForReview(stranger, id, true),
      listings.deleteListing(stranger, id),
    ]);
    for (const attempt of attempts) expect(attempt.ok).toBe(false);
    expect((await listings.getOwnedListing(owner.id, id))?.name).toBe("Test Brochette Corner");
  });
});

describe("filling in a listing", () => {
  it("saves contact details in one standard form", async () => {
    const owner = await newPerson();
    const id = await start(owner);
    expect(
      (await listings.saveContact(owner, id, contact({ instagramUrl: "@testgrill" }))).ok,
    ).toBe(true);

    const b = await listings.getOwnedListing(owner.id, id);
    expect(b).toMatchObject({
      whatsapp: "+250788123456",
      sector: "Kimironko",
      address: null,
      instagramUrl: "https://www.instagram.com/testgrill",
    });
    expect(Number(b?.latitude)).toBeCloseTo(-1.9441);
  });

  it("replaces opening hours and the menu each time they're saved", async () => {
    const owner = await newPerson();
    const id = await start(owner);
    const hours = [
      { dayOfWeek: 1, opensAt: 480, closesAt: 1080 },
      { dayOfWeek: 5, opensAt: 1080, closesAt: 120 },
    ];
    expect((await listings.saveHours(owner, id, JSON.stringify(hours))).ok).toBe(true);
    expect((await listings.saveHours(owner, id, JSON.stringify(hours.slice(1)))).ok).toBe(true);
    expect((await listings.saveHours(owner, id, "{broken")).ok).toBe(false);

    const menu = [
      { title: "Grill", items: [{ name: "Goat brochette", description: "", priceRwf: 1500 }] },
      { title: "Drinks", items: [{ name: "Passion juice", description: "Fresh", priceRwf: null }] },
    ];
    expect((await listings.saveShowcase(owner, id, JSON.stringify(menu))).ok).toBe(true);

    const b = await listings.getOwnedListing(owner.id, id);
    expect(b?.openingHours).toHaveLength(1);
    expect(b?.showcaseSections.map((s) => s.title)).toEqual(["Grill", "Drinks"]);
    expect(b?.showcaseSections[0]?.items[0]).toMatchObject({
      name: "Goat brochette",
      priceRwf: 1500,
    });
  });

  it("keeps the web address once the listing has been public", async () => {
    const owner = await newPerson();
    const id = await start(owner, { name: "Test Renamed Draft" });
    await listings.saveDetails(owner, id, details({ name: "Test Better Name" }));
    const draft = await listings.getOwnedListing(owner.id, id);
    expect(draft?.slug).toMatch(/^test-better-name/);

    await db.business.update({ where: { id }, data: { status: "APPROVED" } });
    await listings.saveDetails(owner, id, details({ name: "Test Another Name" }));
    const live = await listings.getOwnedListing(owner.id, id);
    expect(live?.name).toBe("Test Another Name");
    expect(live?.slug).toBe(draft?.slug);
  });

  it("locks a suspended listing", async () => {
    const owner = await newPerson();
    const id = await start(owner);
    await db.business.update({ where: { id }, data: { status: "SUSPENDED" } });
    const result = await listings.saveContact(owner, id, contact());
    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(/suspended/) });
  });
});

describe("photos", () => {
  it("stores, orders, describes and removes photos", async () => {
    const owner = await newPerson();
    const id = await start(owner);

    expect((await listings.addPhoto(owner, id, await photoBlob(), "Front of the grill")).ok).toBe(
      true,
    );
    expect((await listings.addPhoto(owner, id, await photoBlob(1000, 1000), "")).ok).toBe(true);

    let b = await listings.getOwnedListing(owner.id, id);
    const [first, second] = b!.photos;
    expect(first).toMatchObject({ position: 0, altText: "Front of the grill", width: 1200 });
    expect(second).toMatchObject({ position: 1, altText: "Photo of Test Brochette Corner" });
    for (const size of ["sm", "md", "lg"] as const) {
      expect(await storage.get(photoFileKey(first!.storageKey, size))).not.toBeNull();
    }

    expect((await listings.movePhoto(owner, id, second!.id, "cover")).ok).toBe(true);
    expect((await listings.updatePhotoAlt(owner, id, first!.id, "Grill at night")).ok).toBe(true);
    b = await listings.getOwnedListing(owner.id, id);
    expect(b!.photos.map((p) => p.id)).toEqual([second!.id, first!.id]);
    expect(b!.photos[1]?.altText).toBe("Grill at night");

    expect((await listings.removePhoto(owner, id, second!.id)).ok).toBe(true);
    b = await listings.getOwnedListing(owner.id, id);
    expect(b!.photos).toHaveLength(1);
    expect(b!.photos[0]).toMatchObject({ id: first!.id, position: 0 });
    expect(await storage.get(photoFileKey(second!.storageKey, "lg"))).toBeNull();
  });

  it("refuses files that aren't photos", async () => {
    const owner = await newPerson();
    const id = await start(owner);
    const result = await listings.addPhoto(owner, id, new Blob(["<svg/>"]), "");
    expect(result).toMatchObject({
      ok: false,
      message: expect.stringMatching(/JPEG, PNG or WebP/),
    });
    expect(await db.photo.count({ where: { businessId: id } })).toBe(0);
  });
});

describe("sending for review and deleting", () => {
  it("needs a way to get in touch and the owner's confirmation", async () => {
    const owner = await newPerson();
    const id = await start(owner);

    expect(await listings.submitForReview(owner, id, true)).toMatchObject({
      ok: false,
      message: expect.stringMatching(/way for customers to reach you/),
    });
    await listings.saveContact(owner, id, contact());
    expect(await listings.submitForReview(owner, id, false)).toMatchObject({
      ok: false,
      fieldErrors: { confirm: expect.any(String) },
    });

    expect((await listings.submitForReview(owner, id, true)).ok).toBe(true);
    const b = await listings.getOwnedListing(owner.id, id);
    expect(b?.status).toBe("PENDING");
    expect(b?.submittedAt).toBeInstanceOf(Date);
    expect(outbox.at(-1)).toMatchObject({
      to: owner.email,
      subject: expect.stringMatching(/We received/),
    });
    expect(await getBusinessProfile(b!.slug)).toBeNull();

    expect((await listings.submitForReview(owner, id, true)).ok).toBe(false);
    expect((await listings.deleteListing(owner, id)).ok).toBe(false);
  });

  it("deletes a draft with its photos", async () => {
    const owner = await newPerson();
    const id = await start(owner);
    await listings.addPhoto(owner, id, await photoBlob(), "");
    const key = (await listings.getOwnedListing(owner.id, id))!.photos[0]!.storageKey;

    expect((await listings.deleteListing(owner, id)).ok).toBe(true);
    expect(await db.business.findUnique({ where: { id } })).toBeNull();
    expect(await storage.get(photoFileKey(key, "md"))).toBeNull();
  });
});

describe("claiming an existing listing", () => {
  let target: { id: string; slug: string };

  beforeAll(async () => {
    const found = await db.business.findFirst({
      where: { status: "APPROVED", ownerId: null, isDemo: true },
      select: { id: true, slug: true },
    });
    if (!found) throw new Error("Seed the database first: npm run db:seed");
    target = found;
  });

  const request = {
    relationship: "Owner",
    contactPhone: "0788 123 456",
    message: "I run this place with my family and can show the RDB certificate.",
  };

  it("records one request per person, with private proof", async () => {
    const person = await newPerson();
    const pdf = new Blob(["%PDF-1.7\n%%EOF"]);
    expect((await claims.submitClaim(person, target.slug, request, pdf)).ok).toBe(true);

    const claim = await db.claimRequest.findFirst({ where: { userId: person.id } });
    expect(claim).toMatchObject({
      businessId: target.id,
      status: "PENDING",
      contactPhone: "+250788123456",
      evidenceType: "application/pdf",
      evidenceKey: expect.stringMatching(/^private\/claims\/.+\.pdf$/),
    });
    expect(await storage.get(claim!.evidenceKey!)).not.toBeNull();
    expect(outbox.at(-1)?.subject).toMatch(/request to manage/);

    expect((await claims.getClaimContext(target.slug, person.id)).state.kind).toBe("pending");
    expect((await claims.submitClaim(person, target.slug, request, null)).ok).toBe(false);

    expect((await claims.withdrawClaim(person.id, claim!.id)).ok).toBe(true);
    expect((await db.claimRequest.findUnique({ where: { id: claim!.id } }))?.status).toBe(
      "WITHDRAWN",
    );
    expect(await storage.get(claim!.evidenceKey!)).toBeNull();
    expect((await claims.getClaimContext(target.slug, person.id)).state.kind).toBe("open");
  });

  it("won't let someone withdraw another person's request", async () => {
    const person = await newPerson();
    const stranger = await newPerson("Stranger");
    await claims.submitClaim(person, target.slug, request, null);
    const claim = await db.claimRequest.findFirst({ where: { userId: person.id } });
    expect((await claims.withdrawClaim(stranger.id, claim!.id)).ok).toBe(false);
  });

  it("checks the request and the proof", async () => {
    const person = await newPerson();
    const bad = await claims.submitClaim(
      person,
      target.slug,
      { ...request, message: "mine" },
      null,
    );
    expect(bad).toMatchObject({ ok: false, fieldErrors: { message: expect.any(String) } });

    const html = new Blob(["<html><script>alert(1)</script></html>"]);
    const badProof = await claims.submitClaim(person, target.slug, request, html);
    expect(badProof).toMatchObject({ ok: false, fieldErrors: { evidence: expect.any(String) } });
    expect(await db.claimRequest.count({ where: { userId: person.id } })).toBe(0);
  });

  it("can't claim a listing that already has an owner", async () => {
    const owner = await newPerson();
    const other = await newPerson("Other");
    const id = await start(owner);
    const slug = (await listings.getOwnedListing(owner.id, id))!.slug;
    await db.business.update({ where: { id }, data: { status: "APPROVED" } });

    expect((await claims.getClaimContext(slug, owner.id)).state.kind).toBe("owned-by-you");
    expect((await claims.getClaimContext(slug, other.id)).state.kind).toBe("already-managed");
    expect((await claims.submitClaim(other, slug, request, null)).ok).toBe(false);
    expect((await claims.getClaimContext("no-such-business", other.id)).business).toBeNull();
  });
});
