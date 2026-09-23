import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const businesses = await prisma.business.deleteMany({ where: { isDemo: true } });
  const users = await prisma.user.deleteMany({ where: { isDemo: true } });
  console.log(
    `Removed ${businesses.count} demo businesses and ${users.count} demo users. Real data was not touched.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
