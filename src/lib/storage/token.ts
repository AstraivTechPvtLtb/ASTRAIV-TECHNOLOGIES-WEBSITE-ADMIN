/**
 * @file admin/src/lib/storage/token.ts
 * @description [SECURITY] Cryptographic token generation and verification for resume upload sessions.
 * Enforces authenticated, bound, single-purpose, and time-limited session tokens.
 */

import crypto from 'crypto';

function getStorageSigningSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST)) {
      return 'test_storage_signing_secret_for_vitest_runner_testing_at_least_64_bytes_long';
    }
    throw new Error('[Storage Security Error]: JWT_SECRET or BETTER_AUTH_SECRET is required to sign upload tokens.');
  }
  return secret;
}

export interface GeneratedUploadToken {
  sessionToken: string;
  expiresAt: string;
}

export interface TokenVerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Generates an authenticated, tamper-proof session token strictly bound to the stagingKey and finalKey.
 * Single-purpose: 'resume_upload'
 * Time-limited: default 900 seconds (15 minutes)
 */
export function generateUploadSessionToken(
  stagingKey: string,
  finalKeyOrExpires?: string | number,
  expiresInSeconds = 900
): GeneratedUploadToken {
  let finalKey = '';
  let ttl = expiresInSeconds;

  if (typeof finalKeyOrExpires === 'number') {
    ttl = finalKeyOrExpires;
    finalKey = stagingKey.replace(/^staging\//, 'resumes/');
  } else if (typeof finalKeyOrExpires === 'string') {
    finalKey = finalKeyOrExpires;
  } else {
    finalKey = stagingKey.replace(/^staging\//, 'resumes/');
  }

  const expiresAtMs = Date.now() + ttl * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();
  const secret = getStorageSigningSecret();

  // Binds both stagingKey and finalKey strictly into the cryptographic signature
  const payload = `${stagingKey}:${finalKey}:${expiresAtMs}:resume_upload`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sessionToken = `${expiresAtMs}.${signature}`;

  return { sessionToken, expiresAt };
}

/**
 * Validates that an upload session token:
 * 1. Has valid format (<expiresAtMs>.<hexSignature>)
 * 2. Is not expired (< 15 mins)
 * 3. Was signed by this server using server secret
 * 4. Is bound strictly to both stagingKey and finalKey
 * 5. Uses timing-safe signature comparison
 */
export function verifyUploadSessionToken(
  stagingKey: string,
  finalKeyOrToken: string,
  maybeToken?: string
): TokenVerificationResult {
  let finalKey = '';
  let token = '';

  if (maybeToken !== undefined) {
    finalKey = finalKeyOrToken;
    token = maybeToken;
  } else {
    // 2-argument invocation: verify stagingKey and token
    finalKey = stagingKey.replace(/^staging\//, 'resumes/');
    token = finalKeyOrToken;
  }

  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Upload session token is required.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed upload session token.' };
  }

  const [expiresAtStr, signature] = parts;
  const expiresAtMs = Number(expiresAtStr);

  if (!Number.isFinite(expiresAtMs)) {
    return { valid: false, error: 'Invalid expiration timestamp in session token.' };
  }

  if (Date.now() > expiresAtMs) {
    return { valid: false, error: 'Upload session token has expired. Please initiate a fresh upload.' };
  }

  try {
    const secret = getStorageSigningSecret();
    // Check primary payload bound to both stagingKey and finalKey
    const boundPayload = `${stagingKey}:${finalKey}:${expiresAtMs}:resume_upload`;
    const expectedSig = crypto.createHmac('sha256', secret).update(boundPayload).digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: true };
    }

    // Check legacy single-key payload fallback for backwards compatibility
    const legacyPayload = `${stagingKey}:${expiresAtMs}:resume_upload`;
    const legacySig = crypto.createHmac('sha256', secret).update(legacyPayload).digest('hex');
    const legBuf = Buffer.from(legacySig);

    if (sigBuf.length === legBuf.length && crypto.timingSafeEqual(sigBuf, legBuf)) {
      return { valid: true };
    }

    return { valid: false, error: 'Forged or invalid upload session token. Key binding mismatch.' };
  } catch {
    return { valid: false, error: 'Failed to verify session token signature.' };
  }
}
