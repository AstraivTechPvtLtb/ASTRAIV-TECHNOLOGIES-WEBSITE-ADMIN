/**
 * @file admin/scripts/container-smoke-test.mjs
 * @description Local Container Smoke Test Suite for Astraiv Admin Dashboard.
 * Tests container availability, health probes, auth guards, protected routes, and security boundaries.
 */

const BASE_URL = (process.env.CONTAINER_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

console.log(`[Docker Smoke Test] Verifying Astraiv Admin Container against: ${BASE_URL}`);

const CHECKS = [
  { path: '/api/health', expectedStatus: 200, name: 'Container Health Probe (/api/health)' },
  { path: '/login', expectedStatus: 200, name: 'Admin Login Screen (/login)' },
  { path: '/dashboard', expectedStatus: [307, 308, 302], name: 'Dashboard Unauthenticated Guard (Redirects to Login)' },
  { path: '/api/admin/enquiries/poll', expectedStatus: 401, name: 'Protected Enquiry Stream (401 Unauthorized)' },
  { path: '/api/admin/resumes/download', expectedStatus: 401, name: 'Protected Resume Downloader (401 Unauthorized)' },
  { path: '/favicon.ico', expectedStatus: 200, name: 'Favicon' },
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const check of CHECKS) {
    const url = `${BASE_URL}${check.path}`;
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Astraiv-Docker-SmokeTest/1.0',
          'Cache-Control': 'no-cache',
        },
      });

      const isMatch = Array.isArray(check.expectedStatus)
        ? check.expectedStatus.includes(res.status)
        : res.status === check.expectedStatus;

      if (isMatch) {
        console.log(`  ✓ [PASS] ${check.name} -> HTTP ${res.status}`);
        passed++;
      } else {
        console.error(`  ✗ [FAIL] ${check.name} -> Expected HTTP ${check.expectedStatus}, got ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✗ [FAIL] ${check.name} -> Connection error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[Docker Smoke Test Summary] Passed: ${passed}/${CHECKS.length}, Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('✓ ALL ADMIN CONTAINER CHECKS PASSED SUCCESSFULLY.');
}

runTests();
