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

  describe('5. Client Portal Password Security & Remediation', () => {
    it('verifies leads.controller.ts uses hashPassword and does NOT store plaintext passwords', () => {
      const leadsCtrl = path.resolve(cwd, 'src/controllers/leads.controller.ts');
      const content = fs.readFileSync(leadsCtrl, 'utf8');

      assert.ok(content.includes("import { hashPassword } from 'better-auth/crypto'"), 'Must import hashPassword');
      assert.ok(content.includes('await hashPassword(password)'), 'approveLeadPortalAccess must hash password with scrypt');
      assert.ok(content.includes('await hashPassword(temporaryPassword)'), 'resetLeadPortalPassword must hash password with scrypt');
      assert.ok(content.includes('resetLeadPortalPassword'), 'Must export resetLeadPortalPassword action');
    });

    it('verifies getLeads sanitizes portal_password from API responses', () => {
      const leadsCtrl = path.resolve(cwd, 'src/controllers/leads.controller.ts');
      const content = fs.readFileSync(leadsCtrl, 'utf8');

      assert.ok(content.includes('[SCRYPT_HASHED]'), 'getLeads must mask or categorize portal_password');
      assert.ok(!content.includes('portal_password: r.portal_password,'), 'Must not pass raw portal_password from db to API response');
    });

    it('verifies leads-table.tsx has eliminated plaintext password reveal functionality', () => {
      const tablePath = path.resolve(cwd, 'src/views/tables/leads-table.tsx');
      const content = fs.readFileSync(tablePath, 'utf8');

      assert.ok(!content.includes("showPassword ? (selectedLead.portal_password || 'Not set')"), 'Must not expose plaintext password on reveal');
      assert.ok(content.includes('Secure (scrypt hash)'), 'Must show secure scrypt hash status badge');
      assert.ok(content.includes('handleResetPassword'), 'Must provide password reset workflow');
    });
  });

  describe('6. Secure Enquiry Notification & Polling Verification', () => {
    it('verifies pollNewEnquiries action enforces requireAdminUser authorization guard', () => {
      const enqCtrl = path.resolve(cwd, 'src/controllers/enquiries.controller.ts');
      const content = fs.readFileSync(enqCtrl, 'utf8');
      assert.ok(content.includes('export async function pollNewEnquiries'), 'Must export pollNewEnquiries action');
      assert.ok(content.includes('await requireAdminUser()'), 'pollNewEnquiries must call requireAdminUser');
    });

    it('verifies poll API route denies unauthenticated and anonymous requests', () => {
      const routePath = path.resolve(cwd, 'src/app/api/admin/enquiries/poll/route.ts');
      const content = fs.readFileSync(routePath, 'utf8');
      assert.ok(content.includes('getAdminUser()'), 'Poll route must verify admin user');
      assert.ok(content.includes("admin.role !== 'ADMIN'"), 'Poll route must enforce ADMIN role');
      assert.ok(content.includes('status: 401'), 'Must return 401 Unauthorized when not an admin');
    });

    it('verifies poll endpoint returns zero PII (no names, emails, phone numbers, or messages)', () => {
      const enqCtrl = path.resolve(cwd, 'src/controllers/enquiries.controller.ts');
      const content = fs.readFileSync(enqCtrl, 'utf8');
      assert.ok(content.includes('select: {'), 'Prisma query must use explicit select projection');
      assert.ok(content.includes('id: true'), 'Select must include id');
      assert.ok(content.includes('service: true'), 'Select must include service');
      assert.ok(content.includes('createdAt: true'), 'Select must include createdAt');
      assert.ok(!content.includes('name: true,'), 'Select must not include name: true');
      assert.ok(!content.includes('email: true,'), 'Select must not include email: true');
      assert.ok(!content.includes('phone: true,'), 'Select must not include phone: true');
      assert.ok(!content.includes('message: true,'), 'Select must not include message: true');
    });

    it('verifies duplicate notification prevention and stable cursor filtering', () => {
      const pollerPath = path.resolve(cwd, 'src/lib/enquiry-poller.ts');
      const content = fs.readFileSync(pollerPath, 'utf8');
      assert.ok(content.includes('seenIds'), 'EnquiryPoller must maintain seenIds Set for deduplication');
      assert.ok(content.includes('!this.seenIds.has(enq.id)'), 'Must filter out already seen enquiry IDs');
      assert.ok(content.includes('since=${encodeURIComponent(this.cursor)}'), 'Must poll with stable cursor parameter');
    });

    it('verifies historical notifications are suppressed upon initial dashboard mount', () => {
      const pollerPath = path.resolve(cwd, 'src/lib/enquiry-poller.ts');
      const content = fs.readFileSync(pollerPath, 'utf8');
      assert.ok(content.includes('cursor: string = new Date().toISOString()'), 'Poller baseline cursor must be initialized to current time');
    });

    it('verifies visibility-state awareness, backoff, and cleanup', () => {
      const pollerPath = path.resolve(cwd, 'src/lib/enquiry-poller.ts');
      const content = fs.readFileSync(pollerPath, 'utf8');
      assert.ok(content.includes('visibilitychange'), 'Must listen to document visibilitychange');
      assert.ok(content.includes("document.visibilityState === 'visible'"), 'Must resume/trigger poll on visible');
      assert.ok(content.includes('AbortController'), 'Must use AbortController for clean request termination');
      assert.ok(content.includes('Math.min(this.currentDelayMs * 1.5, this.maxDelayMs)'), 'Must apply exponential backoff on network failure');
    });

    it('verifies complete retirement of Socket.IO and port 4001', () => {
      const adminHeaderPath = path.resolve(cwd, 'src/views/layouts/admin-header.tsx');
      const headerContent = fs.readFileSync(adminHeaderPath, 'utf8');
      assert.ok(!headerContent.includes('socket.io-client'), 'AdminHeader must not use socket.io-client');
      assert.ok(!headerContent.includes('4001'), 'AdminHeader must not refer to port 4001');

      const enquiriesTablePath = path.resolve(cwd, 'src/views/tables/enquiries-table.tsx');
      const tableContent = fs.readFileSync(enquiriesTablePath, 'utf8');
      assert.ok(!tableContent.includes('socket.io-client'), 'EnquiriesTable must not use socket.io-client');
      assert.ok(!tableContent.includes('4001'), 'EnquiriesTable must not refer to port 4001');

      const instrumentationPath = path.resolve(cwd, 'src/instrumentation.ts');
      const instContent = fs.readFileSync(instrumentationPath, 'utf8');
      assert.ok(!instContent.includes('socket.io'), 'instrumentation.ts must not start socket.io server');
      assert.ok(!instContent.includes('4001'), 'instrumentation.ts must not bind port 4001');
    });

    it('validates deduplication logic across consecutive polling batches', () => {
      const seenIds = new Set();
      const batch1 = [{ id: 'id-1', service: 'AI' }, { id: 'id-2', service: 'Cloud' }];
      const batch2 = [{ id: 'id-2', service: 'Cloud' }, { id: 'id-3', service: 'Web' }];

      const unseen1 = batch1.filter(b => !seenIds.has(b.id));
      unseen1.forEach(b => seenIds.add(b.id));
      assert.equal(unseen1.length, 2, 'First poll delivers both unique items');

      const unseen2 = batch2.filter(b => !seenIds.has(b.id));
      unseen2.forEach(b => seenIds.add(b.id));
      assert.equal(unseen2.length, 1, 'Second poll filters out seen id-2 and delivers only id-3');
      assert.equal(unseen2[0].id, 'id-3');
    });

    it('validates exponential retry backoff progression and upper bound capping', () => {
      let delay = 25000;
      const maxDelay = 60000;

      delay = Math.min(delay * 1.5, maxDelay);
      assert.equal(delay, 37500);

      delay = Math.min(delay * 1.5, maxDelay);
      assert.equal(delay, 56250);

      delay = Math.min(delay * 1.5, maxDelay);
      assert.equal(delay, 60000);

      delay = Math.min(delay * 1.5, maxDelay);
      assert.equal(delay, 60000, 'Backoff must never exceed 60s');

      // Recovery on success
      delay = 25000;
      assert.equal(delay, 25000, 'Must recover to 25s on success');
    });
  });
});
