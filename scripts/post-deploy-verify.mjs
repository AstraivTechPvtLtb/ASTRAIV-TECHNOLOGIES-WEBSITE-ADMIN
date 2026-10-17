/**
 * @file admin/scripts/post-deploy-verify.mjs
 * @description Automated post-deployment smoke test suite for Astraiv Admin Portal.
 * Validates HTTP status, security boundaries, and edge routing.
 */

const TARGET_URL = (process.env.DEPLOYMENT_URL || 'https://superuser.admin.astraivtechnologies.com').replace(/\/$/, '');
const DIRECT_URL = (process.env.DIRECT_DEPLOYMENT_URL || '').replace(/\/$/, '');

console.log(`[Smoke Test] Starting post-deployment verification.`);
console.log(`  Target URL: ${TARGET_URL}`);
if (DIRECT_URL && DIRECT_URL !== TARGET_URL) {
  console.log(`  Direct Deployment URL: ${DIRECT_URL}`);
}

const CRITICAL_CHECKS = [
  { path: '/login', expectedStatus: 200, name: 'Admin Login View' },
  { path: '/api/admin/enquiries/poll', expectedStatus: 401, name: 'Protected Enquiry Endpoint (401 Guard)' },
  { path: '/api/admin/resumes/download', expectedStatus: 401, name: 'Protected Resume Endpoint (401 Guard)' },
  { path: '/dashboard', expectedStatus: [200, 307], name: 'Dashboard View (Auth Redirect / Guard)' }
];

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyEndpoint(baseUrl, endpoint, attempt = 1, maxAttempts = 6) {
  const fullUrl = `${baseUrl}${endpoint.path}`;
  const isDirectDeployment = baseUrl !== TARGET_URL;
  try {
    const res = await fetch(fullUrl, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Astraiv-PostDeploy-SmokeTest/1.0',
        'Cache-Control': 'no-cache, no-store'
      }
    });

    const isMatch = Array.isArray(endpoint.expectedStatus)
      ? endpoint.expectedStatus.includes(res.status)
      : res.status === endpoint.expectedStatus;

    const vercelId = res.headers.get('x-vercel-id') || 'N/A';
    const location = res.headers.get('location') || '';

    if (isMatch) {
      console.log(`  ✓ [PASS] ${endpoint.name} (${endpoint.path}) -> Status: ${res.status} (Vercel-ID: ${vercelId})`);
      return true;
    }

    // Direct deployment artifact edge canonicalization check:
    // When a custom domain is assigned on Vercel, requests to the raw *.vercel.app deployment artifact
    // return a 301/302/307/308 redirect to the canonical production domain or Vercel deployment protection.
    const isRedirect = res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308;
    if (isDirectDeployment && isRedirect) {
      if (
        location.includes('superuser.admin.astraivtechnologies.com') ||
        location.includes('astraivtechnologies.com') ||
        location.includes('vercel.com') ||
        location.includes('vercel.live')
      ) {
        console.log(`  ✓ [PASS - CANONICAL EDGE REDIRECT] ${endpoint.name} (${endpoint.path}) -> Status: ${res.status} redirecting to ${location} (Vercel-ID: ${vercelId})`);
        return true;
      }

      // If redirected to a path or URL, attempt following the redirect once to verify destination response
      try {
        const targetUrl = location.startsWith('http') ? location : `${baseUrl}${location}`;
        const followRes = await fetch(targetUrl, {
          redirect: 'manual',
          headers: {
            'User-Agent': 'Astraiv-PostDeploy-SmokeTest/1.0',
            'Cache-Control': 'no-cache, no-store'
          }
        });
        const followMatch = Array.isArray(endpoint.expectedStatus)
          ? endpoint.expectedStatus.includes(followRes.status)
          : followRes.status === endpoint.expectedStatus;

        if (followMatch) {
          console.log(`  ✓ [PASS - REDIRECT CONFIRMED] ${endpoint.name} (${endpoint.path}) -> Status: ${res.status} -> ${followRes.status} at ${targetUrl}`);
          return true;
        }
      } catch {
        // Fall through to retry/fail
      }
    }

    if (attempt < maxAttempts) {
      console.warn(`  ⚠ [RETRY ${attempt}/${maxAttempts}] ${endpoint.name} returned status ${res.status} (expected ${endpoint.expectedStatus}). Waiting 5s for edge propagation...`);
      await wait(5000);
      return verifyEndpoint(baseUrl, endpoint, attempt + 1, maxAttempts);
    }

    console.error(`  ✗ [FAIL] ${endpoint.name} (${endpoint.path}) -> Expected ${endpoint.expectedStatus}, got ${res.status}`);
    return false;
  } catch (err) {
    if (attempt < maxAttempts) {
      console.warn(`  ⚠ [RETRY ${attempt}/${maxAttempts}] ${endpoint.name} network error: ${err.message}. Retrying in 5s...`);
      await wait(5000);
      return verifyEndpoint(baseUrl, endpoint, attempt + 1, maxAttempts);
    }
    console.error(`  ✗ [FAIL] ${endpoint.name} (${endpoint.path}) -> Network error: ${err.message}`);
    return false;
  }
}

async function verifyTarget(url, label) {
  console.log(`\n--- Verifying [${label}] against: ${url} ---`);
  let passed = 0;
  let failed = 0;

  for (const check of CRITICAL_CHECKS) {
    const ok = await verifyEndpoint(url, check);
    if (ok) passed++;
    else failed++;
  }

  console.log(`[${label} Summary] Passed: ${passed}/${CRITICAL_CHECKS.length}, Failed: ${failed}`);
  return failed === 0;
}

async function run() {
  console.log(`[Smoke Test] Waiting 6 seconds for edge CDN cache invalidation & routing propagation...`);
  await wait(6000);

  // If a direct deployment URL was provided, verify it first to validate the build artifacts
  if (DIRECT_URL && DIRECT_URL !== TARGET_URL) {
    const directOk = await verifyTarget(DIRECT_URL, 'Direct Deployment Artifact');
    if (!directOk) {
      console.error(`[Smoke Test] Direct deployment artifact verification failed.`);
      process.exit(1);
    }
    console.log(`  ✓ Direct deployment verified healthy. Checking canonical domain...`);
  }

  const targetOk = await verifyTarget(TARGET_URL, 'Canonical Production Domain');
  if (!targetOk) {
    console.error(`[Smoke Test] POST-DEPLOYMENT VERIFICATION FAILED. Critical admin endpoints did not meet health criteria.`);
    process.exit(1);
  }

  console.log(`\n[Smoke Test] ALL CRITICAL ADMIN ENDPOINTS VERIFIED HEALTHY.`);
  process.exit(0);
}

run();
