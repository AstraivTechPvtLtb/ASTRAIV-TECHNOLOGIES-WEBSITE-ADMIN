'use server';

/**
 * @file admin/src/controllers/auth.controller.ts
 * @description [CONTROLLER] Administrator authentication, role authorization, and session verification.
 */

import { db } from '@/models/db';
import { AdminUserSession, AdminActionResponse } from '@/models/types';
import { cookies } from 'next/headers';
import { verifyPassword } from 'better-auth/crypto';

/**
 * Verifies admin session strictly from the session cookie.
 * Does not bypass authentication without credentials.
 */
export async function getAdminUser(): Promise<AdminUserSession | null> {
  try {
    const cookieStore = await cookies();
    const adminSessionCookie = cookieStore.get('astraiv_admin_session');

    if (adminSessionCookie?.value) {
      const user = await db.user.findUnique({
        where: { id: adminSessionCookie.value },
      });
      if (user && user.role === 'ADMIN') {
        return {
          id: user.id,
          email: user.email,
          fullName: user.name,
          role: user.role,
        };
      }
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
 * Authenticates an administrator with email and password verification.
 * Accepts seed credentials (admin@astraiv.com / Password123) or custom master password.
 */
export async function loginAdmin(email: string, password?: string): Promise<AdminActionResponse> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@astraiv.com').toLowerCase().trim();
    const masterPassword = process.env.ADMIN_MASTER_PASSWORD || 'Password123';

    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    // If admin user is not yet in database but matches master admin credentials, provision it
    if (!user && cleanEmail === adminEmail && password === masterPassword) {
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

    let isMatch = false;

    // Check master password override for the primary administrator
    if (cleanEmail === adminEmail && (password === masterPassword || password === 'Password123')) {
      isMatch = true;
    } else if (account?.password) {
      isMatch = await verifyPassword({
        password,
        hash: account.password,
      });
    }

    if (!isMatch) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('astraiv_admin_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours active session
    });

    return { success: true };
  } catch (error) {
    console.error('[Login Admin Error]:', error);
    return { success: false, error: 'Failed to sign in. Please check database connection.' };
  }
}

/**
 * Logs out the administrator by deleting the session cookie across all paths.
 */
export async function logoutAdmin(): Promise<AdminActionResponse> {
  try {
    const cookieStore = await cookies();
    cookieStore.set('astraiv_admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    cookieStore.delete('astraiv_admin_session');
    return { success: true };
  } catch (error) {
    console.error('[Logout Admin Error]:', error);
    return { success: false, error: 'Failed to log out' };
  }
}


