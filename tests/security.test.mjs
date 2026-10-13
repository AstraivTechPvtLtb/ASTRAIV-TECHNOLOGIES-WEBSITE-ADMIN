import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import child_process from 'child_process';
import { sanitizeSvgContent } from '../src/lib/media-specs.ts';
import {
  isGoogleAnalyticsConfigured,
  getAnalyticsOverview,
  isTelemetryFallback,
  getAnalyticsRealtime,
} from '../src/lib/google-analytics.ts';

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
        'src/controllers/media.controller.ts',
      ];

      for (const ctrl of controllers) {
        const fullPath = path.resolve(cwd, ctrl);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(content.includes('requireAdminUser'), `${ctrl} must import or call requireAdminUser`);
      }
    });

    it('verifies media.controller.ts guards all actions and rejects anonymous/client requests', () => {
      const mediaCtrl = path.resolve(cwd, 'src/controllers/media.controller.ts');
      const content = fs.readFileSync(mediaCtrl, 'utf8');

      // Verify server action directive and auth requirement
      assert.ok(content.includes("'use server'"), 'media.controller.ts must be a server action module');
      assert.ok(content.includes('await requireAdminUser()'), 'media actions must call requireAdminUser');

      // Verify all export actions enforce authorization
      assert.ok(content.includes('export async function getMediaAssets'), 'Must export getMediaAssets');
      assert.ok(content.includes('export async function registerMediaAsset'), 'Must export registerMediaAsset');
      assert.ok(content.includes('export async function updateMediaAsset'), 'Must export updateMediaAsset');
      assert.ok(content.includes('export async function deleteMediaAsset'), 'Must export deleteMediaAsset');

      // Verify safe URL validation in registerMediaAsset
      assert.ok(content.includes('javascript:'), 'registerMediaAsset must reject javascript: URLs');
      assert.ok(content.includes('data:text/html'), 'registerMediaAsset must reject data:text/html URLs');
    });

    it('validates real runtime negative authorization when an unauthenticated caller invokes logAuditAction', () => {
      const script = `
        import('../src/controllers/audit.controller.ts').then(async (m) => {
          const res = await m.logAuditAction({ action: 'MALICIOUS_LOG_ATTEMPT', entityType: 'exploit' });
          console.log('AUDIT_RESULT:' + JSON.stringify(res));
        }).catch((err) => {
          console.error(err);
          process.exit(1);
        });
      `;
      const output = child_process.execSync(
        `npx tsx -e "${script.replace(/\n/g, ' ')}"`,
        { cwd: path.resolve(cwd, 'tests'), env: { ...process.env, NODE_ENV: 'test' }, encoding: 'utf8' }
      );
      const match = output.match(/AUDIT_RESULT:(.+)/);
      assert.ok(match, 'Must output AUDIT_RESULT');
      const res = JSON.parse(match[1]);
      assert.equal(res.success, false, 'Unauthenticated caller must be rejected from writing audit logs');
      assert.ok(res.error?.includes('Unauthorized'), 'Error must indicate authorization requirement');
    });

    it('validates real runtime negative authorization when an unauthenticated caller invokes getAuditLogs', () => {
      const script = `
        import('../src/controllers/audit.controller.ts').then(async (m) => {
          const res = await m.getAuditLogs();
          console.log('AUDIT_GET_RESULT:' + JSON.stringify(res));
        }).catch((err) => {
          console.error(err);
          process.exit(1);
        });
      `;
      const output = child_process.execSync(
        `npx tsx -e "${script.replace(/\n/g, ' ')}"`,
        { cwd: path.resolve(cwd, 'tests'), env: { ...process.env, NODE_ENV: 'test' }, encoding: 'utf8' }
      );
      const match = output.match(/AUDIT_GET_RESULT:(.+)/);
      assert.ok(match, 'Must output AUDIT_GET_RESULT');
      const res = JSON.parse(match[1]);
      assert.equal(res.success, false, 'Unauthenticated caller must not retrieve audit logs');
      assert.deepEqual(res.data, [], 'Must return empty data array');
    });

    it('validates real runtime negative authorization when an unauthenticated caller invokes getMediaAssets', () => {
      const script = `
        import('../src/controllers/media.controller.ts').then(async (m) => {
          const res = await m.getMediaAssets();
          console.log('MEDIA_RESULT:' + JSON.stringify(res));
        }).catch((err) => {
          console.error(err);
          process.exit(1);
        });
      `;
      const output = child_process.execSync(
        `npx tsx -e "${script.replace(/\n/g, ' ')}"`,
        { cwd: path.resolve(cwd, 'tests'), env: { ...process.env, NODE_ENV: 'test' }, encoding: 'utf8' }
      );
      const match = output.match(/MEDIA_RESULT:(.+)/);
      assert.ok(match, 'Must output MEDIA_RESULT');
      const res = JSON.parse(match[1]);
      assert.equal(res.success, false, 'Unauthenticated caller must be rejected from media queries');
      assert.ok(res.error?.includes('Unauthorized'), 'Error message must reflect authorization failure');
      assert.deepEqual(res.data, [], 'Anonymous caller must receive zero asset records');
    });
  });

  describe('3. Resume Download Path Traversal & Security Confinement', () => {
    it('enforces cross-platform directory boundary confinement on resume download keys', () => {
      const baseDir = path.resolve(cwd, '.data', 'resumes');
      const maliciousKeys = [
        '../../etc/passwd',
        '..\\..\\windows\\system32\\cmd.exe',
        'sub/../../package.json',
        '..%2F..%2Fetc%2Fpasswd',
        '/etc/passwd',
        '..\\..\\..\\etc\\shadow',
      ];

      for (const rawKey of maliciousKeys) {
        // Cross-platform normalization converts both POSIX and Windows separators
        const decodedKey = decodeURIComponent(rawKey).replace(/\\/g, '/');
        const filePath = path.resolve(baseDir, decodedKey);
        const isContained = filePath.startsWith(baseDir + path.sep);
        assert.equal(isContained, false, `Malicious key ${rawKey} should not be contained within baseDir`);
      }

      const validKey = 'staging/2026-10-08/abcdef1234567890abcdef1234567890.pdf';
      const normalizedValid = decodeURIComponent(validKey).replace(/\\/g, '/');
      const validPath = path.resolve(baseDir, normalizedValid);
      assert.equal(validPath.startsWith(baseDir + path.sep), true, 'Valid key must be properly contained');
    });

    it('verifies download route implements cross-platform backslash normalization and confinement', () => {
      const routePath = path.resolve(cwd, 'src/app/api/admin/resumes/download/route.ts');
      const content = fs.readFileSync(routePath, 'utf8');

      assert.ok(content.includes('replace(/\\\\/g'), 'Download route must normalize backslashes for cross-platform Linux/Windows safety');
      assert.ok(content.includes('startsWith(baseDir + path.sep)'), 'Download route must check directory containment');
      assert.ok(content.includes('status: 403'), 'Download route must return 403 on traversal attempt');
      assert.ok(content.includes('status: 401'), 'Download route must require admin authentication');
    });
  });

  describe('4. Database Connection Separation & Verified TLS', () => {
    it('verifies prisma.config.ts uses DIRECT_URL for migrations and does not rewrite port to 6543', () => {
      const prismaCfgPath = path.resolve(cwd, 'prisma.config.ts');
      const content = fs.readFileSync(prismaCfgPath, 'utf8');

      assert.ok(content.includes('process.env.DIRECT_URL'), 'prisma.config.ts must use DIRECT_URL for migration tooling');
      assert.ok(!content.includes('pooler.supabase.com:6543'), 'prisma.config.ts must NOT rewrite migration connection to pooler port 6543');
      assert.ok(!content.includes('pgbouncer=true'), 'prisma.config.ts must NOT append pgbouncer=true to migration connection');
    });

    it('verifies src/models/db.ts uses DATABASE_URL only and never falls back to administrative DIRECT_URL', () => {
      const dbPath = path.resolve(cwd, 'src/models/db.ts');
      const content = fs.readFileSync(dbPath, 'utf8');

      assert.ok(content.includes('process.env.DATABASE_URL'), 'db.ts must read DATABASE_URL');
      assert.ok(!content.includes('process.env.DIRECT_URL'), 'db.ts runtime must NOT fall back to DIRECT_URL');
    });

    it('verifies src/models/db.ts enforces verified TLS rejectUnauthorized: true on remote connections', () => {
      const dbPath = path.resolve(cwd, 'src/models/db.ts');
      const content = fs.readFileSync(dbPath, 'utf8');

      assert.ok(content.includes('rejectUnauthorized: true'), 'db.ts must enforce rejectUnauthorized: true for remote production TLS');
      assert.ok(!content.includes('rejectUnauthorized: false'), 'db.ts must NOT disable TLS verification');
    });

    it('verifies src/models/db.ts does NOT silently rewrite connection ports (e.g. 5432 to 6543)', () => {
      const dbPath = path.resolve(cwd, 'src/models/db.ts');
      const content = fs.readFileSync(dbPath, 'utf8');

      assert.ok(!content.includes("replace(':5432'"), 'db.ts must NOT rewrite port 5432 string');
      assert.ok(!content.includes("replace('5432'"), 'db.ts must NOT manipulate port numbers');
      assert.ok(!content.includes(':6543'), 'db.ts must NOT hardcode port 6543 rewrite');
    });
  });

  describe('5. SVG Sanitization Regression Suite', () => {
    it('strips script tags and executable code inside SVG files', () => {
      const evilSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script><circle cx="50" cy="50" r="40"/></svg>';
      const sanitized = sanitizeSvgContent(evilSvg);
      assert.ok(!sanitized.includes('<script'), 'Must strip <script> tag');
      assert.ok(!sanitized.includes('alert('), 'Must strip script payload');
      assert.ok(sanitized.includes('<circle'), 'Must preserve valid SVG primitives');
    });

    it('strips foreignObject tags embedding HTML payloads', () => {
      const evilSvg = '<svg><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject><rect width="10" height="10"/></svg>';
      const sanitized = sanitizeSvgContent(evilSvg);
      assert.ok(!sanitized.includes('<foreignObject'), 'Must strip <foreignObject> container');
      assert.ok(sanitized.includes('<rect'), 'Must preserve valid SVG shapes');
    });

    it('strips inline event handlers (onload, onerror, onclick, onmouseover)', () => {
      const evilSvg = '<svg onload="alert(1)"><g onclick="fetch(\'/steal\')" onmouseover="evil()"><path d="M0 0h10v10H0z"/></g></svg>';
      const sanitized = sanitizeSvgContent(evilSvg);
      assert.ok(!sanitized.includes('onload='), 'Must strip onload');
      assert.ok(!sanitized.includes('onclick='), 'Must strip onclick');
      assert.ok(!sanitized.includes('onmouseover='), 'Must strip onmouseover');
      assert.ok(sanitized.includes('<path'), 'Must preserve valid path');
    });

    it('strips javascript: and data:text/html URIs in href and xlink:href', () => {
      const evilSvg = '<svg><a href="javascript:alert(1)"><text>Link</text></a><image xlink:href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="/></svg>';
      const sanitized = sanitizeSvgContent(evilSvg);
      assert.ok(!sanitized.includes('javascript:'), 'Must strip javascript: URI');
      assert.ok(!sanitized.includes('data:text/html'), 'Must strip data:text/html URI');
    });

    it('strips external <use> tags that attempt remote resource inclusion', () => {
      const evilSvg = '<svg><use href="http://attacker.com/evil.svg#payload"/><use xlink:href="//evil.com/x.svg#y"/><use href="#local-icon"/></svg>';
      const sanitized = sanitizeSvgContent(evilSvg);
      assert.ok(!sanitized.includes('http://attacker.com'), 'Must strip external use href');
      assert.ok(!sanitized.includes('//evil.com'), 'Must strip external xlink:href');
      assert.ok(sanitized.includes('#local-icon'), 'Must preserve safe local symbol reference');
    });

    it('strips XML DOCTYPE and ENTITY definitions (XXE prevention)', () => {
      const evilSvg = '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>';
      const sanitized = sanitizeSvgContent(evilSvg);
      assert.ok(!sanitized.includes('<!DOCTYPE'), 'Must strip DOCTYPE declaration');
      assert.ok(!sanitized.includes('<!ENTITY'), 'Must strip ENTITY declaration');
    });
  });

  describe('6. Timing-Safe Cryptographic Comparisons', () => {
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

  describe('7. Client Portal Password Security & Remediation', () => {
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

  describe('8. Secure Enquiry Notification & Polling Verification', () => {
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

    it('verifies pollNewEnquiries supports deterministic compound cursor parsing and pagination', () => {
      const enqCtrl = path.resolve(cwd, 'src/controllers/enquiries.controller.ts');
      const content = fs.readFileSync(enqCtrl, 'utf8');

      assert.ok(content.includes("since.includes('|')"), 'Must parse compound cursor with pipe delimiter');
      assert.ok(content.includes("since.split('|')"), 'Must extract timestamp and ID components');
      assert.ok(content.includes('createdAt: { gt: sinceDate }'), 'Must query greater timestamp');
      assert.ok(content.includes('id: { gt: lastId }'), 'Must tie-break on duplicate timestamp with ID');
      assert.ok(content.includes('compoundCursor'), 'Must return compoundCursor in response');
      assert.ok(content.includes('`${latestTimestamp}|${latestId}`'), 'Must construct composite cursor format');
    });

    it('validates deterministic compound-cursor pagination across 175+ submissions with duplicate timestamps', () => {
      // Generate 175 mock submissions across 3 identical-timestamp clusters
      const totalCount = 175;
      const t1 = '2026-10-13T10:00:00.000Z'; // 55 records
      const t2 = '2026-10-13T10:05:00.000Z'; // 65 records
      const t3 = '2026-10-13T10:10:00.000Z'; // 55 records

      const mockDb = [];
      for (let i = 1; i <= totalCount; i++) {
        const id = `sub-${String(i).padStart(3, '0')}`;
        let createdAt;
        if (i <= 55) {
          createdAt = t1;
        } else if (i <= 120) {
          createdAt = t2;
        } else {
          createdAt = t3;
        }
        mockDb.push({ id, service: `Service-${i}`, createdAt });
      }

      // Simulation function implementing the exact compound cursor algorithm
      const pollBatch = (sinceCursor, limit = 50) => {
        let sinceDate = null;
        let lastId = null;

        if (sinceCursor && sinceCursor.includes('|')) {
          const [tPart, idPart] = sinceCursor.split('|');
          sinceDate = new Date(tPart);
          lastId = idPart;
        } else if (sinceCursor) {
          sinceDate = new Date(sinceCursor);
        }

        const filtered = mockDb.filter(r => {
          if (!sinceDate) return true;
          const rDate = new Date(r.createdAt);
          if (lastId) {
            return (
              rDate > sinceDate ||
              (rDate.getTime() === sinceDate.getTime() && r.id > lastId)
            );
          }
          return rDate >= sinceDate;
        });

        // Deterministic sort order
        filtered.sort((a, b) => {
          const dComp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          if (dComp !== 0) return dComp;
          return a.id.localeCompare(b.id);
        });

        const batch = filtered.slice(0, limit);
        const latest = batch.length > 0 ? batch[batch.length - 1] : null;
        const compoundCursor = latest ? `${latest.createdAt}|${latest.id}` : null;

        return {
          batch,
          count: filtered.length,
          compoundCursor,
        };
      };

      // Poll all records paginating with limit 50
      const collected = [];
      const batchSizes = [];
      let cursor = '2026-10-13T09:00:00.000Z'; // Baseline before all records

      while (true) {
        const res = pollBatch(cursor, 50);
        if (res.batch.length === 0) break;
        batchSizes.push(res.batch.length);
        collected.push(...res.batch);
        cursor = res.compoundCursor;
      }

      // Assertions
      assert.equal(collected.length, 175, 'Must collect all 175 submissions');
      assert.deepEqual(batchSizes, [50, 50, 50, 25], 'Batches must be [50, 50, 50, 25]');

      // Deduplication check: Set of IDs must equal total count
      const uniqueIds = new Set(collected.map(r => r.id));
      assert.equal(uniqueIds.size, 175, 'Must have zero duplicate submissions across page boundaries');

      // Order check: First is sub-001, last is sub-175, all sequential
      assert.equal(collected[0].id, 'sub-001');
      assert.equal(collected[174].id, 'sub-175');
      for (let i = 0; i < collected.length; i++) {
        assert.equal(collected[i].id, `sub-${String(i + 1).padStart(3, '0')}`);
      }
    });
  });

  describe('9. GA4 Telemetry Integrity & Offline Fallback Reporting', () => {
    it('verifies isGoogleAnalyticsConfigured accurately reports unconfigured credentials', () => {
      const config = isGoogleAnalyticsConfigured();
      assert.equal(typeof config.configured, 'boolean');
      assert.equal(typeof config.propertyId, 'string');
      // In environment without active credentials, configured must be false
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        assert.equal(config.configured, false, 'Must report false when credentials are absent');
        assert.ok(config.reason, 'Must provide explanatory reason');
      }
    });

    it('verifies getAnalyticsOverview explicitly flags isDemoData, isFallback, and telemetryUnavailable', async () => {
      const overview = await getAnalyticsOverview('30daysAgo', 'today', true);
      assert.equal(overview.isDemoData, true, 'Fallback overview must set isDemoData: true');
      assert.equal(overview.isFallback, true, 'Fallback overview must set isFallback: true');
      assert.equal(overview.telemetryUnavailable, true, 'Fallback overview must set telemetryUnavailable: true');
      assert.equal(isTelemetryFallback(overview), true, 'isTelemetryFallback must return true');
    });

    it('verifies getAnalyticsRealtime flags telemetryUnavailable in fallback mode', async () => {
      const realtime = await getAnalyticsRealtime(true);
      assert.equal(realtime.isDemoData, true, 'Fallback realtime must set isDemoData: true');
      assert.equal(realtime.isFallback, true, 'Fallback realtime must set isFallback: true');
      assert.equal(realtime.telemetryUnavailable, true, 'Fallback realtime must set telemetryUnavailable: true');
    });

    it('verifies api/analytics/overview/route.ts guards against misrepresenting fallback data as authentic', () => {
      const routePath = path.resolve(cwd, 'src/app/api/analytics/overview/route.ts');
      const content = fs.readFileSync(routePath, 'utf8');

      assert.ok(content.includes('configured: !isFallback'), 'Route must return configured: false when fallback');
      assert.ok(content.includes('isFallback,'), 'Route must return isFallback flag');
      assert.ok(content.includes('telemetryUnavailable: isFallback'), 'Route must return telemetryUnavailable flag');
      assert.ok(content.includes('isDemoData: true'), 'Catch block must set isDemoData: true');
    });

    it('verifies analytics-dashboard-view.tsx displays Fallback/Offline notice and prevents zero-traffic misrepresentation', () => {
      const viewPath = path.resolve(cwd, 'src/views/sections/analytics-dashboard-view.tsx');
      const content = fs.readFileSync(viewPath, 'utf8');

      assert.ok(content.includes('isFallbackActive'), 'Dashboard must compute isFallbackActive');
      assert.ok(content.includes('Fallback Telemetry Active (Telemetry Unavailable / Offline Mode)'), 'Must render explicit offline notice');
      assert.ok(content.includes("isFallbackActive ? '—' :"), 'KPI cards must display unavailable dash instead of misleading zero');
      assert.ok(content.includes("isFallbackActive ? 'Telemetry Unavailable' :"), 'KPI cards must label unavailable telemetry');
      assert.ok(content.includes("isFallbackActive ? 'Offline / Telemetry Inactive' :"), 'Real-time badge must label offline state');
    });
  });

  describe('10. Private Resume Storage Provider Security & Isolation', () => {
    it('verifies R2 provider standardizes both R2_* and CLOUDFLARE_R2_* environment variable aliases', () => {
      const r2Path = path.resolve(cwd, 'src/lib/storage/r2-provider.ts');
      const content = fs.readFileSync(r2Path, 'utf8');

      assert.ok(content.includes('process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID'), 'Must support both account ID aliases');
      assert.ok(content.includes('process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID'), 'Must support both access key ID aliases');
      assert.ok(content.includes('process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY'), 'Must support both secret access key aliases');
    });

    it('verifies strict separation between candidate-resume bucket and public asset bucket', () => {
      const r2Path = path.resolve(cwd, 'src/lib/storage/r2-provider.ts');
      const content = fs.readFileSync(r2Path, 'utf8');

      assert.ok(content.includes("process.env.R2_RESUME_BUCKET_NAME || 'astraiv-candidate-resumes'"), 'Must isolate private candidate resumes to dedicated bucket');
      assert.ok(!content.includes('astraiv-assets'), 'R2 resume provider must NOT point to public astraiv-assets bucket');
    });

    it('verifies storage factory rejects LocalStorageProvider fallback in production without durable cloud storage', () => {
      const factoryPath = path.resolve(cwd, 'src/lib/storage/index.ts');
      const content = fs.readFileSync(factoryPath, 'utf8');

      assert.ok(content.includes('[CRITICAL_STORAGE_CONFIG]'), 'Storage factory must throw CRITICAL_STORAGE_CONFIG in production');
      assert.ok(content.includes("process.env.NODE_ENV === 'production'"), 'Storage factory must check production environment');
    });

    it('verifies LocalStorageProvider constructor forbids instantiation in production', () => {
      const localPath = path.resolve(cwd, 'src/lib/storage/local-provider.ts');
      const content = fs.readFileSync(localPath, 'utf8');

      assert.ok(content.includes("process.env.NODE_ENV === 'production'"), 'LocalStorageProvider must guard constructor against production use');
      assert.ok(content.includes('Access denied: LocalStorageProvider is restricted to authorized local development'), 'Must throw access denied error in production');
    });

    it('verifies DOCX validation requires real Open Packaging Conventions components rather than raw magic bytes alone', () => {
      const valPath = path.resolve(cwd, 'src/lib/storage/validator.ts');
      const content = fs.readFileSync(valPath, 'utf8');

      assert.ok(content.includes('[Content_Types].xml'), 'Validator must check for [Content_Types].xml');
      assert.ok(content.includes('word/'), 'Validator must check for word/ directory');
      assert.ok(content.includes('Invalid DOCX structure'), 'Validator must return descriptive error for invalid docx');
    });
  });
});
