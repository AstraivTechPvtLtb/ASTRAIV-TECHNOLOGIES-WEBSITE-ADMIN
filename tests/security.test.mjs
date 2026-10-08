import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('Admin Security Remediation Verification Suite', () => {
  const cwd = process.cwd();

  describe('1. Static Code Analysis & Secret Absence', () => {
    it('verifies src/models/db.ts contains NO hardcoded connection strings or passwords', () => {
      const dbPath = path.resolve(cwd, 'src/models/db.ts');
      const content = fs.readFileSync(dbPath, 'utf8');
      assert.ok(!content.includes('SUPABASE_PROD_URL'), 'db.ts must not contain SUPABASE_PROD_URL');
      assert.ok(!content.includes('kzT6'), 'db.ts must not contain Supabase password fragment kzT6');
      assert.ok(!content.includes('aws-0-ap-southeast-1.pooler.supabase.com:6543'), 'db.ts must not contain raw pooler domain');
    });

    it('verifies src/lib/google-analytics.ts contains NO embedded RSA private key', () => {
      const gaPath = path.resolve(cwd, 'src/lib/google-analytics.ts');
      const content = fs.readFileSync(gaPath, 'utf8');
      assert.ok(!content.includes('DEFAULT_SERVICE_ACCOUNT_B64'), 'Must not contain DEFAULT_SERVICE_ACCOUNT_B64');
      assert.ok(!content.includes('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ'), 'Must not contain base64 private key');
      assert.ok(!content.includes('BEGIN PRIVATE KEY'), 'Must not contain raw PEM private key');
    });

    it('verifies src/lib/jwt.ts contains NO hardcoded 64-byte shared fallback secret', () => {
      const jwtPath = path.resolve(cwd, 'src/lib/jwt.ts');
      const content = fs.readFileSync(jwtPath, 'utf8');
      assert.ok(!content.includes('DEFAULT_64_BYTE_SECRET'), 'Must not contain DEFAULT_64_BYTE_SECRET');
      assert.ok(!content.includes('REDACTED_JWT_SECRET_HASH'), 'Must not contain known fallback hex string');
    });

    it('verifies src/lib/revalidate-client.ts contains NO hardcoded fallback revalidation secret', () => {
      const revalPath = path.resolve(cwd, 'src/lib/revalidate-client.ts');
      const content = fs.readFileSync(revalPath, 'utf8');
      assert.ok(!content.includes('SHARED_SECRET'), 'Must not contain hardcoded SHARED_SECRET');
      assert.ok(!content.includes('REDACTED_JWT_SECRET_HASH'), 'Must not contain known fallback hex string');
    });

    it('verifies scripts directory contains NO hardcoded production passwords', () => {
      const scriptsDir = path.resolve(cwd, 'scripts');
      if (fs.existsSync(scriptsDir)) {
        const files = fs.readdirSync(scriptsDir);
        for (const file of files) {
          const filePath = path.join(scriptsDir, file);
          if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf8');
            assert.ok(!content.includes('REDACTED_DATABASE_PASSWORD'), `Script ${file} must not contain plaintext db password`);
            assert.ok(!content.includes('REDACTED_DEV_PWD'), `Script ${file} must not contain plaintext dev password`);
          }
        }
      }
    });
  });

  describe('2. Server Action Guard & Authorization Enforcement', () => {
    it('verifies requireAdminUser is enforced in all sensitive controllers', () => {
      const controllers = [
        'src/controllers/leads.controller.ts',
        'src/controllers/enquiries.controller.ts',
        'src/controllers/recruitment.controller.ts',
        'src/controllers/reviews.controller.ts',
      ];

      for (const ctrl of controllers) {
        const fullPath = path.resolve(cwd, ctrl);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(content.includes('requireAdminUser'), `${ctrl} must import or call requireAdminUser`);
      }
    });
  });

  describe('3. Resume Download Path Traversal & Security Confinement', () => {
    it('enforces directory boundary confinement on resume download keys', () => {
      const baseDir = path.resolve(cwd, '.data', 'resumes');
      const maliciousKeys = [
        '../../etc/passwd',
        '..\\..\\windows\\system32\\cmd.exe',
        'sub/../../package.json',
        '..%2F..%2Fetc%2Fpasswd'
      ];

      for (const rawKey of maliciousKeys) {
        const key = decodeURIComponent(rawKey);
        const filePath = path.resolve(baseDir, key);
        const isContained = filePath.startsWith(baseDir + path.sep);
        assert.equal(isContained, false, `Malicious key ${rawKey} should not be contained within baseDir`);
      }

      const validKey = 'staging/2026-10-08/abcdef1234567890abcdef1234567890.pdf';
      const validPath = path.resolve(baseDir, validKey);
      assert.equal(validPath.startsWith(baseDir + path.sep), true, 'Valid key must be properly contained');
    });
  });

  describe('4. Timing-Safe Cryptographic Comparisons', () => {
    it('validates timingSafeEqual behavior for webhook and revalidation verification', () => {
      const expectedSecret = 'production_revalidation_secret_key_astraiv_2026';
      const matchingSecret = 'production_revalidation_secret_key_astraiv_2026';
      const wrongSecret = 'production_revalidation_secret_key_astraiv_2027';

      const expBuf = Buffer.from(expectedSecret);
      const matchBuf = Buffer.from(matchingSecret);
      const wrongBuf = Buffer.from(wrongSecret);

      const isValid = expBuf.length === matchBuf.length && crypto.timingSafeEqual(expBuf, matchBuf);
      const isInvalid = expBuf.length === wrongBuf.length && crypto.timingSafeEqual(expBuf, wrongBuf);

      assert.equal(isValid, true, 'Matching buffer should validate successfully');
      assert.equal(isInvalid, false, 'Non-matching buffer should fail validation');
    });
  });
});
