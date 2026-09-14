/**
 * @file admin/src/models/db.ts
 * @description [MODEL] Prisma ORM database connection client for the Admin Dashboard.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getCleanConnectionString(): string {
  const raw = process.env.DATABASE_URL || 'postgresql://postgres:Akashindia123@localhost:5432/astraiv_tech?schema=public';
  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

const connectionString = getCleanConnectionString();
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);

// If Prisma client was cached in memory before complianceSetting model was added, discard it
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).complianceSetting) {
  globalForPrisma.prisma = undefined;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
