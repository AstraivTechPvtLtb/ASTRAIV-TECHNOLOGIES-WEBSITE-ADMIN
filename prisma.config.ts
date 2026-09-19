import "dotenv/config";
import { defineConfig } from "prisma/config";

const SUPABASE_PROD_URL =
  "postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  Boolean(process.env.VERCEL_URL);

let rawUrl = process.env.DATABASE_URL?.trim();
if (!rawUrl || (isProduction && (rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")))) {
  rawUrl = SUPABASE_PROD_URL;
}

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
