import "dotenv/config";
import { defineConfig } from "prisma/config";

const rawDirectUrl = process.env.DIRECT_URL?.trim();

// In CI / build environments, DIRECT_URL is absent during static code generation.
// A safe, non-functional localhost fallback allows 'prisma generate' to succeed
// without connecting to a database, while migration tools use explicit DIRECT_URL.
const cleanUrl = rawDirectUrl
  ? rawDirectUrl.replace(/^["']|["']$/g, "").trim()
  : "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

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

