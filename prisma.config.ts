import "dotenv/config";
import { defineConfig } from "prisma/config";

const rawUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "postgresql://postgres:postgres@localhost:5432/astraiv_db";

const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, "").trim();

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

