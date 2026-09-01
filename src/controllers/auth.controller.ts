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
 * Verifies active admin session strictly from the session cookie.
 */
export async function getAdminUser(): Promise<AdminUserSession | null> {
  try {
    const cookieStore = await cookies();
    const adminSessionCookie = cookieStore.get('astraiv_admin_session');

    if (!adminSessionCookie?.value) {
      return null;
    }

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

    return null;
  } catch (error) {
    console.error('[Get Admin User Error]:', error);
    return null;
  }
}

/**
 * Authenticates an administrator with email & password and sets session cookie.
 */
export async function loginAdmin(email: string, password?: string): Promise<AdminActionResponse> {
  try {
    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
      },
    });

    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Invalid credentials or administrator access required.' };
    }

    const account = user.accounts[0];
    if (!account?.password) {
      return { success: false, error: 'No password credential found for this account.' };
    }

    const isPasswordValid = await verifyPassword({
      hash: account.password,
      password: password,
    });

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('astraiv_admin_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('[Login Admin Error]:', error);
    return { success: false, error: 'Failed to sign in. Database connection error.' };
  }
}

/**
 * Logs out the administrator.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('astraiv_admin_session');
}
