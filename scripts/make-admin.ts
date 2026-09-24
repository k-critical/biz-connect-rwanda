// Gives an existing, confirmed account the ADMIN role. There is deliberately no default admin
// or built-in password: register normally first, confirm your email, then run
//   npm run user:make-admin -- you@example.com
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const email = process.argv[2]?.trim();
if (!email) {
  console.error("Usage: npm run user:make-admin -- someone@example.com");
  process.exit(1);
}

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) {
    throw new Error(`No account uses ${email}. Register at /register first.`);
  }
  if (!user.emailVerified) {
    throw new Error(`${email} hasn't confirmed their email yet. Confirm it, then try again.`);
  }
  if (user.role === "ADMIN") {
    console.log(`${user.name} <${user.email}> is already an admin.`);
    return;
  }
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`${user.name} <${user.email}> is now an admin.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
