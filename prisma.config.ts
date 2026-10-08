import "dotenv/config";
import { defineConfig } from "prisma/config";

const rawUrl = process.env.DATABASE_URL?.trim() || "postgresql://postgres:postgres@localhost:5432/astraiv_db";

let cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, "").trim();
if (cleanUrl.includes("pooler.supabase.com:5432")) {
  cleanUrl = cleanUrl.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543");
  if (!cleanUrl.includes("pgbouncer=true")) {
    cleanUrl += (cleanUrl.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
}

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
