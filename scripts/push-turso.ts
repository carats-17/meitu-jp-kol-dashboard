import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";

/**
 * Push Prisma schema to Turso.
 * Usage:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:push:turso
 *
 * Keep DATABASE_URL as file:./prisma/dev.db in .env — Prisma CLI cannot use libsql://.
 */
async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url?.startsWith("libsql://") || !authToken) {
    console.error("缺少 TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf8" },
  );

  const statements = sql
    .split(";")
    .map((chunk) =>
      chunk
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);

  if (statements.length === 0) {
    console.error("No SQL statements generated from schema.");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  console.log(`Applying ${statements.length} statements to Turso...`);
  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Idempotent re-runs: table/index already exists
      if (/already exists/i.test(message)) {
        console.log(`skip (exists): ${statement.slice(0, 60)}...`);
        continue;
      }
      throw err;
    }
  }
  console.log("Done. Turso schema is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
