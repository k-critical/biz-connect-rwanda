// Runs the admin decisions against the local database (seeded with `npm run db:seed`).
// Test people use a reserved email domain and are removed afterwards; demo listings they
// were given are handed back unowned. Emails are captured instead of queued.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailMessage } from "@/server/mail/templates";

const outbox = vi.hoisted(() => [] as EmailMessage[]);
vi.mock("@/server/mail/mailer", () => ({
  sendEmail: async (message: EmailMessage) => {
    outbox.push(message);
  },
  queueEmail: async (message: EmailMessage) => {
    outbox.push(message);
  },
}));

const { db } = await import("@/server/db");
const { getBusinessProfile } = await import("./directory-service");
const listings = await import("./listing-service");
const claims = await import("./claim-service");
const admin = await import("./admin-service");

const DOMAIN = "admin-test.bizconnect.test";
let counter = 0;

async function newPerson(name = "Test Person", role: "VISITOR" | "ADMIN" = "VISITOR") {
  const user = await db.user.create({
    data: {
      name,
      role,
      emailVerified: true,
      email: `person-${Date.now()}-${counter++}@${DOMAIN}`,
    },
  });
  return { id: user.id, name: user.name, email: user.email };
}

async function cleanUp() {
  const mine = { owner: { email: { endsWith: `@${DOMAIN}` } } };
  // Demo listings handed to test people through claims go back to having no owner.
  await db.business.updateMany({ where: { ...mine, isDemo: true }, data: { ownerId: null } });
  await db.business.deleteMany({ where: { ...mine, isDemo: false } });
  const people = await db.user.findMany({
    where: { email: { endsWith: `@${DOMAIN}` } },
    select: { id: true },
  });
  await db.auditLog.deleteMany({ where: { actorId: { in: people.map((p) => p.id) } } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
}

/** A listing sent for review by a new owner. */
async function pendingListing(name = "Test Review Grill") {
  const owner = await newPerson("Test Owner");
  const started = await listings.startListing(owner, {
    name,
    tagline: "Goat brochettes and fresh juice",
    description: "A small family grill near the market, open late. Cash and MoMo accepted.",
    category: "restaurants",
    extraCategories: [],
    district: "gasabo",
    priceLevel: "",
  });
  if (!started.ok) throw new Error(started.message);
  const id = started.value.id;
  await listings.saveContact(owner, id, {
    sector: "",
    address: "",
    latitude: "",
    longitude: "",
    whatsapp: "0788 123 456",
    phone: "",
    email: "",
    website: "",
    facebookUrl: "",
    instagramUrl: "",
  });
  const sent = await listings.submitForReview(owner, id, true);
  if (!sent.ok) throw new Error(sent.message);
  const business = await db.business.findUniqueOrThrow({ where: { id } });
  return { owner, id, slug: business.slug };
}

let reviewer: { id: string; name: string; email: string };

beforeAll(async () => {
  await cleanUp();
  reviewer = await newPerson("Test Admin", "ADMIN");
});
afterAll(async () => {
  await cleanUp();
  await db.$disconnect();
});
beforeEach(() => {
  outbox.length = 0;
});

const auditFor = (targetId: string) =>
  db.auditLog.findMany({ where: { targetId }, orderBy: { createdAt: "asc" } });

describe("reviewing a listing", () => {
  it("sends it back with a reason, then publishes it", async () => {
    const { owner, id, slug } = await pendingListing();

    const noReason = await admin.decideListing(reviewer, id, "reject", "  ");
    expect(noReason).toMatchObject({ ok: false, fieldErrors: { note: expect.any(String) } });

    const note = "Please add a photo of the shop front and your opening hours.";
    expect((await admin.decideListing(reviewer, id, "reject", note)).ok).toBe(true);
    expect(await db.business.findUnique({ where: { id } })).toMatchObject({
      status: "REJECTED",
      reviewNote: note,
    });
    const rejection = outbox.filter((m) => m.to === owner.email).at(-1);
    expect(rejection?.subject).toMatch(/needs a few changes/);
    expect(rejection?.text).toContain(note);

    // It can't be sent back twice, but it can be approved after changes.
    expect((await admin.decideListing(reviewer, id, "reject", note)).ok).toBe(false);
    expect((await admin.decideListing(reviewer, id, "approve", "")).ok).toBe(true);

    const live = await db.business.findUnique({ where: { id } });
    expect(live).toMatchObject({ status: "APPROVED", reviewNote: null });
    expect(live?.reviewedAt).toBeInstanceOf(Date);
    expect(await getBusinessProfile(slug)).not.toBeNull();
    expect(outbox.at(-1)).toMatchObject({
      to: owner.email,
      subject: expect.stringMatching(/is live/),
    });

    const log = await auditFor(id);
    expect(log.map((entry) => entry.action)).toEqual(["listing.reject", "listing.approve"]);
    expect(log[0]).toMatchObject({ actorId: reviewer.id, details: { note } });
  });

  it("only lets one of two admins decide at the same moment", async () => {
    const { id } = await pendingListing("Test Race Salon");
    const results = await Promise.all([
      admin.decideListing(reviewer, id, "approve", ""),
      admin.decideListing(reviewer, id, "approve", ""),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toMatchObject({ message: expect.stringMatching(/already/) });
    expect(await auditFor(id)).toHaveLength(1);
  });

  it("features, suspends and restores a live listing", async () => {
    const { owner, id, slug } = await pendingListing("Test Suspend Bar");
    await admin.decideListing(reviewer, id, "approve", "");

    expect((await admin.setListingFeatured(reviewer, id, true)).ok).toBe(true);
    expect((await db.business.findUnique({ where: { id } }))?.isFeatured).toBe(true);

    const reason = "Several visitors reported that this number belongs to someone else.";
    expect((await admin.decideListing(reviewer, id, "suspend", reason)).ok).toBe(true);
    expect(await db.business.findUnique({ where: { id } })).toMatchObject({
      status: "SUSPENDED",
      isFeatured: false,
      reviewNote: reason,
    });
    expect(await getBusinessProfile(slug)).toBeNull();
    expect(outbox.at(-1)).toMatchObject({
      to: owner.email,
      subject: expect.stringMatching(/hidden/),
    });
    expect((await admin.setListingFeatured(reviewer, id, true)).ok).toBe(false);

    // The owner can't edit while it's suspended.
    const edit = await listings.saveHours(owner, id, "[]");
    expect(edit).toMatchObject({ ok: false, message: expect.stringMatching(/suspended/) });

    expect((await admin.decideListing(reviewer, id, "restore", "")).ok).toBe(true);
    expect(await getBusinessProfile(slug)).not.toBeNull();
    expect((await auditFor(id)).map((e) => e.action)).toEqual([
      "listing.approve",
      "listing.feature",
      "listing.suspend",
      "listing.restore",
    ]);
  });

  it("answers politely about listings that don't exist", async () => {
    expect((await admin.decideListing(reviewer, "not-a-uuid", "approve", "")).ok).toBe(false);
    expect(
      (await admin.decideListing(reviewer, "00000000-0000-4000-8000-000000000000", "approve", ""))
        .ok,
    ).toBe(false);
  });
});

describe("deciding claims", () => {
  let target: { id: string; slug: string; name: string };
  const request = {
    relationship: "Owner",
    contactPhone: "0788 123 456",
    message: "I run this place with my family and can show the RDB certificate.",
  };

  beforeAll(async () => {
    const found = await db.business.findFirst({
      where: { status: "APPROVED", ownerId: null, isDemo: true },
      // listing-service.test.ts claims from the other end of the list; test files run in parallel.
      orderBy: { name: "desc" },
      select: { id: true, slug: true, name: true },
    });
    if (!found) throw new Error("Seed the database first: npm run db:seed");
    target = found;
  });

  it("gives the listing to one person and turns down the others", async () => {
    const first = await newPerson("First Claimant");
    const second = await newPerson("Second Claimant");
    await claims.submitClaim(first, target.slug, request, null);
    await claims.submitClaim(second, target.slug, request, null);
    const [firstClaim, secondClaim] = await Promise.all([
      db.claimRequest.findFirstOrThrow({ where: { userId: first.id } }),
      db.claimRequest.findFirstOrThrow({ where: { userId: second.id } }),
    ]);
    outbox.length = 0;

    expect((await admin.decideClaim(reviewer, firstClaim.id, "approve", "")).ok).toBe(true);

    expect((await db.business.findUnique({ where: { id: target.id } }))?.ownerId).toBe(first.id);
    expect((await db.user.findUnique({ where: { id: first.id } }))?.role).toBe("OWNER");
    expect((await db.claimRequest.findUnique({ where: { id: secondClaim.id } }))?.status).toBe(
      "REJECTED",
    );
    expect(outbox.map((m) => [m.to, m.subject])).toEqual([
      [first.email, expect.stringMatching(/You now manage/)],
      [second.email, expect.stringMatching(/About your request/)],
    ]);
    expect(await listings.getOwnedListing(first.id, target.id)).not.toBeNull();

    // The second request is closed, and a new one can't take the listing away.
    expect((await admin.decideClaim(reviewer, secondClaim.id, "approve", "")).ok).toBe(false);
    expect((await auditFor(firstClaim.id)).map((e) => e.action)).toEqual(["claim.approve"]);

    await db.business.update({ where: { id: target.id }, data: { ownerId: null } });
  });

  it("needs a reason to turn a claim down", async () => {
    const person = await newPerson();
    await claims.submitClaim(person, target.slug, request, null);
    const claim = await db.claimRequest.findFirstOrThrow({ where: { userId: person.id } });

    const noReason = await admin.decideClaim(reviewer, claim.id, "reject", "no");
    expect(noReason).toMatchObject({ ok: false, fieldErrors: { note: expect.any(String) } });

    const note = "We couldn't reach you on the number you gave. Please send a trading licence.";
    expect((await admin.decideClaim(reviewer, claim.id, "reject", note)).ok).toBe(true);
    expect(await db.claimRequest.findUnique({ where: { id: claim.id } })).toMatchObject({
      status: "REJECTED",
      decisionNote: note,
    });
    expect(outbox.at(-1)?.text).toContain(note);
    expect((await db.business.findUnique({ where: { id: target.id } }))?.ownerId).toBeNull();
  });
});

describe("reports", () => {
  it("lets a visitor report a listing once, and an admin close it", async () => {
    const visitor = await newPerson("Visitor");
    const { owner, id, slug } = await pendingListing("Test Reported Shop");
    await admin.decideListing(reviewer, id, "approve", "");

    const report = { reason: "WRONG_INFO", message: "The phone number rings a different shop." };
    expect((await admin.submitReport(owner, slug, report)).ok).toBe(false);
    expect(
      await admin.submitReport(visitor, slug, { reason: "BORING", message: "x" }),
    ).toMatchObject({
      ok: false,
      fieldErrors: { reason: expect.any(String), message: expect.any(String) },
    });

    expect((await admin.submitReport(visitor, slug, report)).ok).toBe(true);
    expect((await admin.submitReport(visitor, slug, report)).ok).toBe(false);

    const saved = await db.report.findFirstOrThrow({ where: { reporterId: visitor.id } });
    expect(saved).toMatchObject({ businessId: id, status: "OPEN", reason: "WRONG_INFO" });

    expect(
      (await admin.closeReportAs(reviewer, saved.id, "resolve", "Asked the owner to fix it.")).ok,
    ).toBe(true);
    expect(await db.report.findUnique({ where: { id: saved.id } })).toMatchObject({
      status: "RESOLVED",
      resolutionNote: "Asked the owner to fix it.",
    });
    expect((await admin.closeReportAs(reviewer, saved.id, "dismiss", "")).ok).toBe(false);
    expect((await auditFor(saved.id)).map((e) => e.action)).toEqual(["report.resolve"]);
  });

  it("can't report a listing that isn't live", async () => {
    const visitor = await newPerson("Visitor");
    const { slug } = await pendingListing("Test Hidden Draft");
    const result = await admin.submitReport(visitor, slug, {
      reason: "OTHER",
      message: "Something looks wrong here.",
    });
    expect(result.ok).toBe(false);
  });
});

describe("the admin screens' data", () => {
  it("counts the queues and lists the audit log newest first", async () => {
    const { id } = await pendingListing("Test Counted Cafe");
    const counts = await admin.getAdminCounters();
    expect(counts.pendingListings).toBeGreaterThanOrEqual(1);

    const queue = await admin.getListingQueue("PENDING", 1, "Test Counted");
    expect(queue.items.map((b) => b.id)).toContain(id);

    await admin.decideListing(reviewer, id, "approve", "");
    const log = await admin.getAuditLog(1);
    expect(log.items[0]).toMatchObject({ targetId: id, action: "listing.approve" });
    expect(log.items[0]?.actor?.name).toBe("Test Admin");
  });
});
