import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/analytics-auth';
import {
  getAnalyticsOverview,
  normalizeDateRange,
  isGoogleAnalyticsConfigured,
} from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return auth.response;
  }

  const { searchParams } = req.nextUrl;
  const range = searchParams.get('range');
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');
  const forceDemo = searchParams.get('demo') === 'true';

  const normalized = normalizeDateRange(range, customStart, customEnd);
  const config = isGoogleAnalyticsConfigured();

  try {
    const data = await getAnalyticsOverview(normalized.startDate, normalized.endDate, forceDemo);

    return NextResponse.json({
      success: true,
      range: normalized.label,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      configured: config.configured,
      configReason: config.reason,
      data,
    });
  } catch (error) {
    console.error('[API Analytics Overview Error]:', error);
    return NextResponse.json({
      success: true,
      range: normalized.label,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      configured: config.configured,
      configReason: config.reason,
      data: {
        totalUsers: 0,
        newUsers: 0,
        sessions: 0,
        screenPageViews: 0,
        engagementRate: 0,
        eventCount: 0,
        isDemoData: false,
      },
    });
  }
}
