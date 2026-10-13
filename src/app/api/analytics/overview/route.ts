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
    const postConfig = isGoogleAnalyticsConfigured();

    const isFallback =
      !postConfig.configured ||
      Boolean(data.isDemoData || data.isFallback || data.telemetryUnavailable);

    return NextResponse.json({
      success: true,
      range: normalized.label,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      configured: !isFallback,
      configReason: isFallback
        ? postConfig.reason || config.reason || 'Google Analytics 4 telemetry is unavailable or unauthenticated (Fallback mode active)'
        : undefined,
      isFallback,
      telemetryUnavailable: isFallback,
      data,
    });
  } catch (error) {
    console.error('[API Analytics Overview Error]:', error);
    return NextResponse.json({
      success: true,
      range: normalized.label,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      configured: false,
      configReason: 'GA4 telemetry service error. Operating in offline fallback mode.',
      isFallback: true,
      telemetryUnavailable: true,
      data: {
        totalUsers: 0,
        newUsers: 0,
        sessions: 0,
        screenPageViews: 0,
        engagementRate: 0,
        eventCount: 0,
        isDemoData: true,
        isFallback: true,
        telemetryUnavailable: true,
      },
    });
  }
}
