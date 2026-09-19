import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/analytics-auth';
import { getAnalyticsUsersTimeline, normalizeDateRange } from '@/lib/google-analytics';

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

  try {
    const data = await getAnalyticsUsersTimeline(normalized.startDate, normalized.endDate, forceDemo);

    return NextResponse.json({
      success: true,
      range: normalized.label,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      data,
    });
  } catch (error) {
    console.error('[API Analytics Users Error]:', error);
    return NextResponse.json({
      success: true,
      range: normalized.label,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      data: [],
    });
  }
}
