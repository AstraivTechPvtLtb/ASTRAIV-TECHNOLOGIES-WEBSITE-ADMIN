import "dotenv/config";
import { defineConfig } from "prisma/config";

const rawDirectUrl = process.env.DIRECT_URL?.trim();
if (!rawDirectUrl) {
  throw new Error(
    "Security Violation: DIRECT_URL environment variable is strictly required for Prisma migrations. " +
    "Silent fallbacks to DATABASE_URL or default connection strings are disabled to prevent unintended database mutations."
  );
}

const cleanUrl = rawDirectUrl.replace(/^["']|["']$/g, "").trim();

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: cleanUrl,
  },
});

