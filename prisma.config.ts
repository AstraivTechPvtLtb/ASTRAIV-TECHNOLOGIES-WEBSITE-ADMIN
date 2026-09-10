import "dotenv/config";
import { defineConfig } from "prisma/config";

const rawUrl = process.env.DATABASE_URL || "postgresql://postgres:Akashindia123@localhost:5432/astraiv_tech?schema=public";
const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, '').trim();

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
