/**
 * @file admin/src/models/db.ts
 * @description [MODEL] Prisma ORM database connection client for the Admin Dashboard.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
  connStr: string | undefined;
};

function getCleanConnectionString(): string {
  let raw = process.env.DATABASE_URL?.trim();

  if (!raw) {
    if (
      process.env.NODE_ENV === 'test' ||
      Boolean(process.env.CI) ||
      process.env.NEXT_PHASE === 'phase-production-build'
    ) {
      raw = 'postgresql://postgres:postgres@localhost:5432/astraiv_db';
    } else {
      throw new Error(
        '[Database Error]: DATABASE_URL environment variable is missing. A valid PostgreSQL connection string is required.'
      );
    }
  }

  const conn = raw.trim().replace(/^["']|["']$/g, '').trim();

  return conn;
}


/**
 * Canonical Supabase Root CA 2021 Certificate.
 * Enables strict TLS verification (rejectUnauthorized: true) against Supabase poolers
 * without requiring file system access or external environment variables.
 */
const SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;

function getSslCa(connStr: string): string | undefined {
  if (process.env.PGSSLROOTCERT && fs.existsSync(process.env.PGSSLROOTCERT)) {
    return fs.readFileSync(process.env.PGSSLROOTCERT).toString();
  }
  if (connStr.includes('supabase.com') || connStr.includes('supabase.co')) {
    return SUPABASE_ROOT_CA;
  }
  return undefined;
}

const connectionString = getCleanConnectionString();
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const sslCa = !isLocalhost ? getSslCa(connectionString) : undefined;

// If connection string changed during hot reload (e.g. switching between local and Supabase), reset cached pool and client
if (globalForPrisma.connStr && globalForPrisma.connStr !== connectionString) {
  if (globalForPrisma.pool) {
    globalForPrisma.pool.end().catch(() => {});
    globalForPrisma.pool = undefined;
  }
  globalForPrisma.prisma = undefined;
}
globalForPrisma.connStr = connectionString;

const pool =
  globalForPrisma.pool ??
  new pg.Pool({
    connectionString,
    ssl: isLocalhost
      ? false
      : {
          rejectUnauthorized: true,
          ...(sslCa ? { ca: sslCa } : {}),
        },
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.DEBUG_PRISMA ? ['error', 'warn'] : [],
  });

globalForPrisma.prisma = db;
globalForPrisma.pool = pool;

export { pool };
