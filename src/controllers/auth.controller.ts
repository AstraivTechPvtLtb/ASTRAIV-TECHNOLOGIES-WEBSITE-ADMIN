'use server';

/**
 * @file admin/src/controllers/auth.controller.ts
 * @description [CONTROLLER] Administrator authentication, role authorization, Supabase OTP verification, and JWT session handling.
 */

import { db } from '@/models/db';
import { AdminUserSession, AdminActionResponse, DEFAULT_ADMIN_EMAIL } from '@/models/types';
import { cookies } from 'next/headers';
import { verifyPassword, hashPassword } from 'better-auth/crypto';
import {
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY_SECONDS,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from '@/lib/jwt';
import { sendSupabaseAuthOtp, verifySupabaseAuthOtp } from '@/models/supabase-auth';

// In-memory session cache to prevent parallel database storms when multiple API routes fire simultaneously
const adminUserCache = new Map<string, { user: AdminUserSession; expiresAt: number }>();

/**
 * Resolves the primary configured administrator email.
 */
function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
}

/**
 * Helper to set standard JWT authentication cookies.
 */
async function setAuthCookies(tokens: { accessToken: string; refreshToken: string }, userId: string) {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  // 1. JWT Access Token Cookie (60-day validity)
  cookieStore.set('astraiv_admin_access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });

  // 2. JWT Refresh Token Cookie (30-day validity)
  cookieStore.set('astraiv_admin_refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
  });

  // 3. Backwards-compatible session identifier cookie
  cookieStore.set('astraiv_admin_session', userId, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });
}

/**
 * Helper to remove all authentication cookies on sign out.
 */
async function clearAuthCookies() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  const clearOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };

  cookieStore.set('astraiv_admin_access_token', '', clearOptions);
  cookieStore.set('astraiv_admin_refresh_token', '', clearOptions);
  cookieStore.set('astraiv_admin_session', '', clearOptions);

  cookieStore.delete('astraiv_admin_access_token');
  cookieStore.delete('astraiv_admin_refresh_token');
  cookieStore.delete('astraiv_admin_session');
}

/**
 * Verifies admin session strictly from the JWT access token (or fallback session cookie).
 * Validates cryptographic signature and role permissions.
 */
export async function getAdminUser(): Promise<AdminUserSession | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('astraiv_admin_access_token')?.value;
    const refreshToken = cookieStore.get('astraiv_admin_refresh_token')?.value;
    const legacySessionId = cookieStore.get('astraiv_admin_session')?.value;

    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    // 1. Validate JWT Access Token (60 days)
    if (accessToken) {
      const accessResult = await verifyAccessToken(accessToken);
      if (accessResult.valid && accessResult.payload) {
        targetUserId = accessResult.payload.userId;
        targetEmail = accessResult.payload.email;
      }
    }

    // 2. If access token is invalid/expired but refresh token is valid (30 days), attempt refresh
    if (!targetUserId && refreshToken) {
      const refreshResult = await verifyRefreshToken(refreshToken);
      if (refreshResult.valid && refreshResult.payload) {
        targetUserId = refreshResult.payload.userId;
        targetEmail = refreshResult.payload.email;

        // Auto-refresh token pair and re-set cookies
        if (targetUserId && targetEmail) {
          const newTokens = await generateAuthTokens({
            id: targetUserId,
            email: targetEmail,
            role: 'ADMIN',
          });
          await setAuthCookies(newTokens, targetUserId);
        }
      }
    }

    // 3. Fallback to legacy session cookie if migrating from previous session
    if (!targetUserId && legacySessionId) {
      targetUserId = legacySessionId;
    }

    if (!targetUserId) {
      return null;
    }

    const now = Date.now();
    const cached = adminUserCache.get(targetUserId);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (user && user.role === 'ADMIN') {
      const sessionUser: AdminUserSession = {
        id: user.id,
        email: user.email,
        fullName: user.name,
        role: user.role,
      };

      // Cache for 60 seconds to prevent DB hammering
      adminUserCache.set(targetUserId, {
        user: sessionUser,
        expiresAt: now + 60 * 1000,
      });

      return sessionUser;
    }

    return null;
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error && error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('[Get Admin User Error]:', error);
    return null;
  }
}

/**
 * Sends a Supabase email OTP for administrator login.
 * Validates that the provided email is authorized.
 */
export async function sendAdminLoginOtp(email: string): Promise<AdminActionResponse> {
  try {
    if (!email) {
      return { success: false, error: 'Administrator email is required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = getAdminEmail();

    // Check if email matches configured admin email or an existing admin in database
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    const isAuthorized = cleanEmail === adminEmail || (user && user.role === 'ADMIN');
    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized email address. Access denied.' };
    }

    const otpResponse = await sendSupabaseAuthOtp(cleanEmail, 'login');
    return {
      success: otpResponse.success,
      message: otpResponse.message,
      error: otpResponse.error,
    };
  } catch (error) {
    console.error('[Send Admin Login OTP Error]:', error);
    return { success: false, error: 'Failed to send login OTP. Please try again.' };
  }
}

/**
 * Verifies the administrator login OTP, issues JWT tokens, and creates session.
 */
export async function verifyAdminLoginOtp(email: string, otp: string): Promise<AdminActionResponse> {
  try {
    if (!email || !otp) {
      return { success: false, error: 'Email and 6-digit OTP are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = getAdminEmail();

    // Verify the OTP via Supabase Auth (or local dev console store)
    const verification = await verifySupabaseAuthOtp(cleanEmail, otp, 'login');
    if (!verification.success) {
      return { success: false, error: verification.error || 'Invalid or expired OTP.' };
    }

    // Provision admin user in database if it doesn't exist yet
    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user && cleanEmail === adminEmail) {
      user = await db.user.create({
        data: {
          name: 'Astraiv Admin',
          email: cleanEmail,
          emailVerified: true,
          role: 'ADMIN',
        },
      });
    }

    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'User is not authorized as an administrator.' };
    }

    // Generate JWT Access Token (60 days) and Refresh Token (30 days)
    const tokens = await generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.name,
    });

    await setAuthCookies(tokens, user.id);

    return {
      success: true,
      message: 'Login successful.',
      data: { redirectUrl: '/dashboard' },
    };
  } catch (error) {
    console.error('[Verify Admin Login OTP Error]:', error);
    return { success: false, error: 'Failed to verify OTP and initialize session.' };
  }
}

/**
 * Authenticates an administrator with email and password verification.
 * Issues 60-day JWT Access Token and 30-day Refresh Token upon success.
 */
export async function loginAdmin(email: string, password?: string): Promise<AdminActionResponse> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = getAdminEmail();

    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user && cleanEmail === adminEmail) {
      user = await db.user.create({
        data: {
          name: 'Astraiv Admin',
          email: cleanEmail,
          emailVerified: true,
          role: 'ADMIN',
        },
      });
    }

    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Invalid credentials or unauthorized account.' };
    }

    const account = await db.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
      },
    });

    if (!account?.password) {
      return {
        success: false,
        error:
          'No password has been configured for this account yet. Please log in using Email OTP or click "Forgot Password" to set your password.',
      };
    }

    const isMatch = await verifyPassword({
      password,
      hash: account.password,
    });

    if (!isMatch) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Generate JWT Access Token (60 days) and Refresh Token (30 days)
    const tokens = await generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.name,
    });

    await setAuthCookies(tokens, user.id);

    return { success: true };
  } catch (error) {
    console.error('[Login Admin Error]:', error);
    return { success: false, error: 'Failed to sign in. Please check database connection.' };
  }
}

/**
 * Requests an OTP for changing the administrator password.
 * Dispatches code to the currently logged in administrator's verified email.
 */
export async function requestPasswordChangeOtp(): Promise<AdminActionResponse> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return { success: false, error: 'You must be logged in to request a password change.' };
    }

    const otpResponse = await sendSupabaseAuthOtp(admin.email, 'change_password');
    return {
      success: otpResponse.success,
      message: otpResponse.message || `Verification code sent to ${admin.email}.`,
      error: otpResponse.error,
    };
  } catch (error) {
    console.error('[Request Password Change OTP Error]:', error);
    return { success: false, error: 'Failed to send password change verification code.' };
  }
}

/**
 * Changes administrator password with mandatory OTP verification.
 * Hashes new password securely and stores it in the database account record.
 */
export async function changeAdminPasswordWithOtp(input: {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AdminActionResponse> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return { success: false, error: 'Authentication required.' };
    }

    const { otp, newPassword, confirmPassword } = input;

    if (!otp || !newPassword || !confirmPassword) {
      return { success: false, error: 'All fields are required.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New password and confirmation do not match.' };
    }

    // Verify OTP
    const verification = await verifySupabaseAuthOtp(admin.email, otp, 'change_password');
    if (!verification.success) {
      return { success: false, error: verification.error || 'Invalid or expired OTP code.' };
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Upsert the Account credential record in Prisma DB
    const existingAccount = await db.account.findFirst({
      where: {
        userId: admin.id,
        providerId: 'credential',
      },
    });

    const now = new Date();
    if (existingAccount) {
      await db.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: now,
        },
      });
    } else {
      await db.account.create({
        data: {
          id: `acc_${admin.id}_credential`,
          accountId: admin.email,
          providerId: 'credential',
          userId: admin.id,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    console.log(`[ADMIN SECURITY] Password successfully changed for administrator: ${admin.email}`);

    return {
      success: true,
      message: 'Password updated successfully. You can now use your new password to sign in.',
    };
  } catch (error) {
    console.error('[Change Admin Password Error]:', error);
    return { success: false, error: 'Failed to update password. Please try again.' };
  }
}

/**
 * Sends a password reset OTP to an administrator email from the login page.
 */
export async function sendAdminForgotPasswordOtp(email: string): Promise<AdminActionResponse> {
  try {
    if (!email) {
      return { success: false, error: 'Administrator email is required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = getAdminEmail();

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    const isAuthorized = cleanEmail === adminEmail || (user && user.role === 'ADMIN');
    if (!isAuthorized) {
      return { success: false, error: 'Unauthorized email address. Access denied.' };
    }

    const otpResponse = await sendSupabaseAuthOtp(cleanEmail, 'change_password');
    return {
      success: otpResponse.success,
      message: otpResponse.message || `Password reset code sent to ${cleanEmail}.`,
      error: otpResponse.error,
    };
  } catch (error) {
    console.error('[Send Admin Forgot Password OTP Error]:', error);
    return { success: false, error: 'Failed to send password reset code.' };
  }
}

// In-memory password reset authorization tokens (15-minute expiry)
const resetAuthTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * Verifies the OTP entered by the administrator during Forgot Password.
 * Upon success, issues a temporary reset authorization token for setting the new password.
 */
export async function verifyAdminForgotPasswordOtp(
  email: string,
  otp: string
): Promise<AdminActionResponse<{ resetToken: string }>> {
  try {
    if (!email || !otp) {
      return { success: false, error: 'Email and 6-digit OTP are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const verification = await verifySupabaseAuthOtp(cleanEmail, otp, 'change_password');
    if (!verification.success) {
      return { success: false, error: verification.error || 'Invalid or expired OTP code.' };
    }

    const resetToken =
      Math.random().toString(36).substring(2) +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2);

    resetAuthTokens.set(cleanEmail, {
      token: resetToken,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    // Also persist in db.verification so server hot-reloads never drop the token
    try {
      await db.verification.upsert({
        where: { id: `reset_auth_${cleanEmail}` },
        update: {
          value: resetToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          updatedAt: new Date(),
        },
        create: {
          id: `reset_auth_${cleanEmail}`,
          identifier: cleanEmail,
          value: resetToken,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          createdAt: new Date(),
        },
      });
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      message: 'OTP verified successfully.',
      data: { resetToken },
    };
  } catch (error) {
    console.error('[Verify Admin Forgot Password OTP Error]:', error);
    return { success: false, error: 'Failed to verify OTP code.' };
  }
}

/**
 * Resets the administrator password using verified OTP or reset token from the login page.
 */
export async function resetAdminPasswordWithOtp(input: {
  email: string;
  resetToken?: string;
  otp?: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AdminActionResponse> {
  try {
    const { email, resetToken, otp, newPassword, confirmPassword } = input;

    if (!email || (!resetToken && !otp) || !newPassword || !confirmPassword) {
      return { success: false, error: 'All fields are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = getAdminEmail();

    // Verify either reset authorization token or direct OTP
    let isAuthorized = false;
    if (resetToken) {
      const cached = resetAuthTokens.get(cleanEmail);
      if (cached && cached.token === resetToken && cached.expiresAt > Date.now()) {
        isAuthorized = true;
        resetAuthTokens.delete(cleanEmail);
      } else {
        // Check persistent db.verification
        try {
          const dbRec = await db.verification.findUnique({
            where: { id: `reset_auth_${cleanEmail}` },
          });
          if (dbRec && dbRec.value === resetToken && dbRec.expiresAt > new Date()) {
            isAuthorized = true;
            await db.verification.delete({ where: { id: dbRec.id } }).catch(() => {});
          }
        } catch {
          // Fall through
        }
      }
    }

    if (!isAuthorized && otp) {
      const verification = await verifySupabaseAuthOtp(cleanEmail, otp, 'change_password');
      if (verification.success) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return {
        success: false,
        error: 'Invalid or expired authorization. Please request a new OTP code.',
      };
    }

    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user && cleanEmail === adminEmail) {
      user = await db.user.create({
        data: {
          name: 'Astraiv Admin',
          email: cleanEmail,
          emailVerified: true,
          role: 'ADMIN',
        },
      });
    }

    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'User is not authorized as an administrator.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New password and confirmation do not match.' };
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Upsert the Account credential record in Prisma DB
    const existingAccount = await db.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
      },
    });

    const now = new Date();
    if (existingAccount) {
      await db.account.update({
        where: { id: existingAccount.id },
        data: {
          password: hashedPassword,
          updatedAt: now,
        },
      });
    } else {
      await db.account.create({
        data: {
          id: `acc_${user.id}_credential`,
          accountId: user.email,
          providerId: 'credential',
          userId: user.id,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    console.log(`[ADMIN SECURITY] Password successfully reset for administrator: ${cleanEmail}`);

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  } catch (error) {
    console.error('[Reset Admin Password Error]:', error);
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }
}

/**
 * Logs out the administrator by deleting all JWT and session cookies.
 */
export async function logoutAdmin(): Promise<AdminActionResponse> {
  try {
    await clearAuthCookies();
    adminUserCache.clear();
    return { success: true };
  } catch (error) {
    console.error('[Logout Admin Error]:', error);
    return { success: false, error: 'Failed to log out.' };
  }
}
