import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql/web";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const log =
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as const)
      : (["error"] as const);

  if (tursoUrl?.startsWith("libsql://")) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter, log: [...log] });
  }

  return new PrismaClient({ log: [...log] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
