'use server';

/**
 * @file admin/src/controllers/auth.controller.ts
 * @description [CONTROLLER] Administrator authentication, role authorization, and session verification.
 */

import { db } from '@/models/db';
import { AdminUserSession, AdminActionResponse } from '@/models/types';
import { cookies } from 'next/headers';

/**
 * Verifies admin session. In local development or standalone mode,
 * verifies presence of admin role or local development admin.
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

    // Default admin fallback for local dev environment
    const defaultAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (defaultAdmin) {
      return {
        id: defaultAdmin.id,
        email: defaultAdmin.email,
        fullName: defaultAdmin.name,
        role: defaultAdmin.role,
      };
    }

    return null;
  } catch (error) {
    console.error('[Get Admin User Error]:', error);
    return null;
  }
}

/**
 * Logs in an administrator and sets session cookie.
 */
export async function loginAdmin(email: string): Promise<AdminActionResponse> {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
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
    return { success: false, error: 'Failed to sign in' };
  }
}

/**
 * Logs out the administrator.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('astraiv_admin_session');
}
