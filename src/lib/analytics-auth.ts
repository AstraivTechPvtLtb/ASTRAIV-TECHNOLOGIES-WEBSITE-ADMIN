/**
 * @file admin/src/lib/analytics-auth.ts
 * @description [SECURITY] Admin session verification helper for Analytics API routes.
 */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/controllers/auth.controller';
import { AdminUserSession } from '@/models/types';

export async function verifyAdminSession(): Promise<
  { authorized: true; user: AdminUserSession } | { authorized: false; response: NextResponse }
> {
  try {
    const user = await getAdminUser();

    if (!user) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized: Valid administrator session required.' },
          { status: 401 }
        ),
      };
    }

    if (user.role !== 'ADMIN') {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden: Administrator privileges required for telemetry data.' },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, user };
  } catch (error) {
    console.error('[Analytics Auth Error]:', error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Internal Server Error: Authentication verification failed.' },
        { status: 500 }
      ),
    };
  }
}
