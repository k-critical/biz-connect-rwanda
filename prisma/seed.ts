import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { categories } from "../src/config/categories";
import { demoBusinesses } from "./seed-data/demo-businesses";
import { districtSlug, provinces } from "./seed-data/locations";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set. Run `npm run db:setup` first.");

// Demo listings get no contact number unless you choose one, so nobody real gets messaged.
const demoContactNumber = process.env["SEED_DEMO_WHATSAPP"] || null;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedCategories() {
  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: index },
      create: { slug: category.slug, name: category.name, sortOrder: index },
    });
  }
}

async function seedLocations() {
  for (const province of provinces) {
    const { id: provinceId } = await prisma.province.upsert({
      where: { slug: province.slug },
      update: { name: province.name },
      create: { slug: province.slug, name: province.name },
    });
    for (const name of province.districts) {
      await prisma.district.upsert({
        where: { slug: districtSlug(name) },
        update: { name, provinceId },
        create: { slug: districtSlug(name), name, provinceId },
      });
    }
  }
}

async function seedDemoBusinesses() {
  const categoryIds = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id] as const),
  );
  const districtIds = new Map(
    (await prisma.district.findMany()).map((d) => [d.name, d.id] as const),
  );

  await prisma.business.deleteMany({ where: { isDemo: true } });

  for (const b of demoBusinesses) {
    await prisma.business.create({
      data: {
        slug: b.slug,
        name: b.name,
        tagline: b.tagline,
        description: b.description,
        status: b.status,
        isFeatured: b.featured ?? false,
        isDemo: true,
        priceLevel: b.priceLevel,
        sector: b.sector,
        whatsapp: demoContactNumber,
        phone: demoContactNumber,
        district: { connect: { id: districtIds.get(b.district)! } },
        categories: {
          create: b.categories.map((slug, position) => ({
            position,
            category: { connect: { id: categoryIds.get(slug)! } },
          })),
        },
        openingHours: {
          create: Object.entries(b.hours).flatMap(([day, periods]) =>
            (periods ?? []).map(([opensAt, closesAt]) => ({
              dayOfWeek: Number(day),
              opensAt,
              closesAt,
            })),
          ),
        },
        showcaseSections: {
          create: (b.showcase ?? []).map((section, position) => ({
            title: section.title,
            position,
            items: {
              create: section.items.map((item, itemPosition) => ({
                ...item,
                position: itemPosition,
              })),
            },
          })),
        },
      },
    });
  }
}

async function main() {
  await seedCategories();
  await seedLocations();
  await seedDemoBusinesses();

  const counts = {
    categories: await prisma.category.count(),
    provinces: await prisma.province.count(),
    districts: await prisma.district.count(),
    demoBusinesses: await prisma.business.count({ where: { isDemo: true } }),
    approvedDemoBusinesses: await prisma.business.count({
      where: { isDemo: true, status: "APPROVED" },
    }),
  };
  const expected = {
    categories: categories.length,
    provinces: 5,
    districts: 30,
    demoBusinesses: demoBusinesses.length,
    approvedDemoBusinesses: demoBusinesses.filter((b) => b.status === "APPROVED").length,
  };
  console.table(counts);
  for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
    if (counts[key] !== expected[key]) {
      throw new Error(`Seed check failed: expected ${expected[key]} ${key}, found ${counts[key]}.`);
    }
  }
  console.log(
    demoContactNumber
      ? "Demo listings use SEED_DEMO_WHATSAPP as their contact number."
      : "Demo listings have no contact number (set SEED_DEMO_WHATSAPP to test WhatsApp buttons).",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
