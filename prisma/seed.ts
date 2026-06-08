import { PrismaClient } from "@prisma/client";
import { importFromCSV, CSV_TEMPLATE } from "../src/lib/import";

const prisma = new PrismaClient();

async function main() {
  await importFromCSV(CSV_TEMPLATE, "seed");
  console.log("Seed data imported.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
