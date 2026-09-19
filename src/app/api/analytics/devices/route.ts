import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/analytics-auth';
import {
  getAnalyticsDevices,
  getAnalyticsTechnology,
  normalizeDateRange,
} from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = req.nextUrl;
    const range = searchParams.get('range');
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');
    const forceDemo = searchParams.get('demo') === 'true';

    const normalized = normalizeDateRange(range, customStart, customEnd);
    const [devices, technology] = await Promise.all([
      getAnalyticsDevices(normalized.startDate, normalized.endDate, forceDemo),
      getAnalyticsTechnology(normalized.startDate, normalized.endDate, forceDemo),
    ]);

    return NextResponse.json({
      success: true,
      range: normalized.label,
      data: {
        devices,
        technology,
      },
    });
  } catch (error) {
    console.error('[API Analytics Devices Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || 'Failed to fetch device analytics.',
      },
      { status: 500 }
    );
  }
}
