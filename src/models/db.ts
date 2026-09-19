/**
 * @file admin/src/models/db.ts
 * @description [MODEL] Prisma ORM database connection client for the Admin Dashboard.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

const SUPABASE_PROD_URL =
  'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

function getCleanConnectionString(): string {
  let raw = process.env.DATABASE_URL?.trim();
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.VERCEL_URL);

  // In production / Vercel, or if DATABASE_URL is missing or points to localhost in production:
  if (!raw || (isProduction && (raw.includes('localhost') || raw.includes('127.0.0.1')))) {
    raw = SUPABASE_PROD_URL;
  }

  let conn = raw.trim().replace(/^["']|["']$/g, '').trim();

  // If a pooler.supabase.com URL uses port 5432 (session mode), automatically upgrade to port 6543 (transaction mode with pgbouncer)
  // to avoid (EMAXCONNSESSION) max clients reached errors on serverless
  if (conn.includes('pooler.supabase.com:5432')) {
    conn = conn.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
    if (!conn.includes('pgbouncer=true')) {
      conn += (conn.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
  }

  return conn;
}

const connectionString = getCleanConnectionString();
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool =
  globalForPrisma.pool ??
  new pg.Pool({
    connectionString,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
const adapter = new PrismaPg(pool);

// If Prisma client was cached in memory before complianceSetting model was added, discard it
if (globalForPrisma.prisma && !(globalForPrisma.prisma as unknown as { complianceSetting?: unknown }).complianceSetting) {
  globalForPrisma.prisma = undefined;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.prisma = db;
globalForPrisma.pool = pool;
