/**
 * @file admin/src/app/api/admin/enquiries/poll/route.ts
 * @description [API] Authenticated polling endpoint for real-time contact enquiry notifications.
 * Enforces requireAdminUser authorization, zero PII payload, and stable cursor filtering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/controllers/auth.controller';
import { pollNewEnquiries } from '@/controllers/enquiries.controller';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Valid administrator privileges required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since') || undefined;

    const result = await pollNewEnquiries(since);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[API Enquiries Poll Error]:', (error as Error)?.message || error);
    return NextResponse.json(
      { error: 'Internal server error processing enquiry poll' },
      { status: 500 }
    );
  }
}
