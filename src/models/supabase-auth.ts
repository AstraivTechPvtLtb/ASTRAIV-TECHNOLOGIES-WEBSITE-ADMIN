/**
 * @file admin/src/models/supabase-auth.ts
 * @description [MODEL] Supabase Authentication & Email OTP provider for Admin Portal.
 * Dispatches live OTPs via Supabase Auth (free-of-cost email verification),
 * with development console display for local admin login.
 */

import { isSupabaseConfigured, createClient } from './supabase';
import { db } from './db';

// In-memory fallback OTP storage (useful during local development or when Supabase keys are pending)
const localOtpStore = new Map<string, { otp: string; expiresAt: number }>();

export interface SupabaseOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  isLocalDev?: boolean;
}

/**
 * Sends a One-Time Passcode (OTP) to the specified administrator email.
 * - For live deployment with Supabase configured: sends email free of charge via Supabase Auth.
 * - For local development: prints the OTP prominently in the server console for immediate access.
 */
export async function sendSupabaseAuthOtp(
  email: string,
  purpose: 'login' | 'change_password' = 'login'
): Promise<SupabaseOtpResponse> {
  const cleanEmail = email.toLowerCase().trim();
  const isLocal = process.env.NODE_ENV !== 'production';
  const supabaseReady = isSupabaseConfigured();
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Store locally in-memory and in DB verification table
  localOtpStore.set(cleanEmail, { otp: generatedOtp, expiresAt });

  try {
    // Also save in DB verification table if available
    await db.verification.upsert({
      where: { id: `otp_${cleanEmail}_${purpose}` },
      update: {
        value: generatedOtp,
        expiresAt: new Date(expiresAt),
        updatedAt: new Date(),
      },
      create: {
        id: `otp_${cleanEmail}_${purpose}`,
        identifier: cleanEmail,
        value: generatedOtp,
        expiresAt: new Date(expiresAt),
        createdAt: new Date(),
      },
    }).catch(() => {
      // Non-blocking if table or connection is in read-only/offline mode
    });
  } catch {
    // Non-blocking
  }

  // Always log in development/local environments
  if (isLocal) {
    console.log('\n' + '='.repeat(65));
    console.log(`🔑 [ASTRAIV LOCAL ADMIN OTP - ${purpose.toUpperCase()}]`);
    console.log(`Target Email : ${cleanEmail}`);
    console.log(`Verification Code (OTP) : >>>  ${generatedOtp}  <<<`);
    console.log(`Expiry       : 15 minutes (until ${new Date(expiresAt).toLocaleTimeString()})`);
    console.log('='.repeat(65) + '\n');
  }

  // If Supabase is configured with a valid key, attempt live Supabase Auth email dispatch
  if (supabaseReady) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error('[Supabase Auth OTP Error]:', error.message);
        if (isLocal) {
          return {
            success: true,
            message: 'OTP generated (Check server console for local code).',
            isLocalDev: true,
          };
        }
        return {
          success: false,
          error: `Email OTP dispatch failed: ${error.message}. Please check NEXT_PUBLIC_SUPABASE_ANON_KEY in hosting environment variables or sign in using Password.`,
          isLocalDev: false,
        };
      }

      return {
        success: true,
        message: 'Verification code sent to your email address.',
        isLocalDev: false,
      };
    } catch (error: unknown) {
      console.error('[Supabase Auth Client Error]:', error);
      if (isLocal) {
        return {
          success: true,
          message: 'OTP generated (Check server console for local code).',
          isLocalDev: true,
        };
      }
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Supabase authentication error: ${msg}. Please sign in with your Password.`,
        isLocalDev: false,
      };
    }
  }

  // If Supabase is not configured (missing or invalid key in hosting environment)
  if (isLocal) {
    return {
      success: true,
      message: 'Local mode active: Verification code printed to your server terminal console.',
      isLocalDev: true,
    };
  }

  return {
    success: false,
    error: 'Live Supabase email OTP is not configured on this server. Please enter using your Administrator Password or configure a valid NEXT_PUBLIC_SUPABASE_ANON_KEY in your hosting environment variables.',
    isLocalDev: false,
  };
}

/**
 * Verifies a 6-digit One-Time Passcode (OTP).
 * Checks both live Supabase Auth and local development store.
 */
export async function verifySupabaseAuthOtp(
  email: string,
  token: string,
  purpose: 'login' | 'change_password' = 'login'
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanToken = token.trim();

  if (!cleanToken || cleanToken.length < 6) {
    return { success: false, error: 'Please enter a valid 6-digit verification code.' };
  }

  // 1. If Supabase is configured, try live Supabase verification
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (!error && data?.user) {
        localOtpStore.delete(cleanEmail);
        return { success: true };
      }
    } catch {
      // Fall through to local verification check
    }
  }

  // 2. Check in-memory store
  const cached = localOtpStore.get(cleanEmail);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.otp === cleanToken) {
      localOtpStore.delete(cleanEmail);
      return { success: true };
    }
  }

  // 3. Check DB verification table
  try {
    const record = await db.verification.findUnique({
      where: { id: `otp_${cleanEmail}_${purpose}` },
    });

    if (record && record.value === cleanToken && record.expiresAt > new Date()) {
      await db.verification.delete({
        where: { id: record.id },
      }).catch(() => {});
      localOtpStore.delete(cleanEmail);
      return { success: true };
    }
  } catch {
    // Non-blocking
  }

  return { success: false, error: 'Invalid or expired verification code. Please request a new one.' };
}
