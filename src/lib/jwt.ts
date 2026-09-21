/**
 * @file admin/src/lib/jwt.ts
 * @description [UTILITY] Enterprise JWT authentication service powered by WebCrypto 'jose'.
 * Manages access tokens (valid for 60 days) and refresh tokens (valid for 30 days) with 32-byte cryptographic keys.
 */

import { SignJWT, jwtVerify } from 'jose';

// Default cryptographic secret (must be at least 64 bytes / 512 bits for HS512 / high-entropy HS256)
const DEFAULT_64_BYTE_SECRET =
  '47a9e48c7732e9d6b94d7470263c34ab7c71d27c2815a4e2c5623a1c416dbb524bbe844b4cd056d1b1792b6265a9539d4546d196f5a629ab43ec00eea11a79db8';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  fullName?: string;
  tokenType?: 'access' | 'refresh';
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number; // in seconds (60 days = 5,184,000s)
  refreshExpiresIn: number; // in seconds (30 days = 2,592,000s)
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

// 60 days in seconds = 60 * 24 * 60 * 60 = 5,184,000s
export const ACCESS_TOKEN_EXPIRY_SECONDS = 60 * 24 * 60 * 60;
// 30 days in seconds = 30 * 24 * 60 * 60 = 2,592,000s
export const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

/**
 * Returns the encoded Uint8Array secret key for signing and verifying tokens.
 * Ensures the key is at least 64 bytes (512 bits).
 */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || DEFAULT_64_BYTE_SECRET;
  // Pad secret if shorter than 64 bytes
  const paddedSecret = secret.length >= 64 ? secret : secret.padEnd(64, '_');
  return new TextEncoder().encode(paddedSecret);
}

/**
 * Signs an Access Token valid for 60 days.
 */
export async function signAccessToken(payload: Omit<JWTPayload, 'tokenType'>): Promise<string> {
  const secret = getJwtSecretKey();
  const expiry = process.env.JWT_ACCESS_EXPIRES_IN || '60d';

  return await new SignJWT({
    ...payload,
    tokenType: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret);
}

/**
 * Signs a Refresh Token valid for 30 days.
 */
export async function signRefreshToken(payload: Pick<JWTPayload, 'userId'> & Partial<JWTPayload>): Promise<string> {
  const secret = getJwtSecretKey();
  const expiry = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    tokenType: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret);
}

/**
 * Generates both Access Token (60-day) and Refresh Token (30-day).
 */
export async function generateAuthTokens(user: {
  id: string;
  email: string;
  role?: string;
  fullName?: string;
}): Promise<AuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    }),
    signRefreshToken({
      userId: user.id,
      email: user.email,
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    refreshExpiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
  };
}

/**
 * Verifies an Access Token and ensures tokenType is 'access'.
 */
export async function verifyAccessToken(token: string): Promise<TokenValidationResult> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (payload.tokenType !== 'access') {
      return { valid: false, error: 'Invalid token type: expected access token.' };
    }

    return {
      valid: true,
      payload: {
        userId: (payload.sub || payload.userId) as string,
        email: payload.email as string,
        role: payload.role as string | undefined,
        fullName: payload.fullName as string | undefined,
        tokenType: 'access',
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid or expired access token.';
    return { valid: false, error: message };
  }
}

/**
 * Verifies a Refresh Token and ensures tokenType is 'refresh'.
 */
export async function verifyRefreshToken(token: string): Promise<TokenValidationResult> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (payload.tokenType !== 'refresh') {
      return { valid: false, error: 'Invalid token type: expected refresh token.' };
    }

    return {
      valid: true,
      payload: {
        userId: (payload.sub || payload.userId) as string,
        email: payload.email as string,
        tokenType: 'refresh',
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid or expired refresh token.';
    return { valid: false, error: message };
  }
}

/**
 * Extracts Bearer token from an Authorization header value.
 */
export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
}
