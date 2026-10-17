/**
 * @file admin/scripts/post-deploy-verify.mjs
 * @description Automated post-deployment smoke test suite for Astraiv Admin Portal.
 * Validates HTTP status, security boundaries, and edge routing.
 */

const TARGET_URL = (process.env.DEPLOYMENT_URL || 'https://superuser.admin.astraivtechnologies.com').replace(/\/$/, '');

console.log(`[Smoke Test] Starting post-deployment verification against: ${TARGET_URL}`);

const CRITICAL_CHECKS = [
  { path: '/login', expectedStatus: 200, name: 'Admin Login View' },
  { path: '/api/admin/enquiries/poll', expectedStatus: 401, name: 'Protected Enquiry Endpoint (401 Guard)' },
  { path: '/api/admin/resumes/download', expectedStatus: 401, name: 'Protected Resume Endpoint (401 Guard)' },
  { path: '/dashboard', expectedStatus: [200, 307], name: 'Dashboard View (Auth Redirect / Guard)' }
];

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyEndpoint(endpoint, attempt = 1, maxAttempts = 5) {
  const fullUrl = `${TARGET_URL}${endpoint.path}`;
  try {
    const res = await fetch(fullUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Astraiv-PostDeploy-SmokeTest/1.0'
      }
    });

    const isMatch = Array.isArray(endpoint.expectedStatus)
      ? endpoint.expectedStatus.includes(res.status)
      : res.status === endpoint.expectedStatus;

    const vercelId = res.headers.get('x-vercel-id') || 'N/A';

    if (isMatch) {
      console.log(`  ✓ [PASS] ${endpoint.name} (${endpoint.path}) -> Status: ${res.status} (Vercel-ID: ${vercelId})`);
      return true;
    }

    if (attempt < maxAttempts) {
      console.warn(`  ⚠ [RETRY ${attempt}/${maxAttempts}] ${endpoint.name} returned status ${res.status} (expected ${endpoint.expectedStatus}). Waiting 4s for edge propagation...`);
      await wait(4000);
      return verifyEndpoint(endpoint, attempt + 1, maxAttempts);
    }

    console.error(`  ✗ [FAIL] ${endpoint.name} (${endpoint.path}) -> Expected ${endpoint.expectedStatus}, got ${res.status}`);
    return false;
  } catch (err) {
    if (attempt < maxAttempts) {
      console.warn(`  ⚠ [RETRY ${attempt}/${maxAttempts}] ${endpoint.name} network error: ${err.message}. Retrying in 4s...`);
      await wait(4000);
      return verifyEndpoint(endpoint, attempt + 1, maxAttempts);
    }
    console.error(`  ✗ [FAIL] ${endpoint.name} (${endpoint.path}) -> Network error: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log(`[Smoke Test] Waiting 5 seconds for edge CDN cache invalidation & routing propagation...`);
  await wait(5000);

  let passed = 0;
  let failed = 0;

  for (const check of CRITICAL_CHECKS) {
    const ok = await verifyEndpoint(check);
    if (ok) passed++;
    else failed++;
  }

  console.log(`\n[Smoke Test Summary] Passed: ${passed}/${CRITICAL_CHECKS.length}, Failed: ${failed}`);

  if (failed > 0) {
    console.error(`[Smoke Test] POST-DEPLOYMENT VERIFICATION FAILED. Critical admin endpoints did not meet health criteria.`);
    process.exit(1);
  }

  console.log(`[Smoke Test] ALL CRITICAL ADMIN ENDPOINTS VERIFIED HEALTHY.`);
  process.exit(0);
}

run();
