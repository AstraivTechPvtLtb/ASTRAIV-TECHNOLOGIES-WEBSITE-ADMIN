import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/analytics-auth';
import { getAnalyticsPages, normalizeDateRange } from '@/lib/google-analytics';

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
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const forceDemo = searchParams.get('demo') === 'true';

  const normalized = normalizeDateRange(range, customStart, customEnd);

  try {
    const { pages, totalViews } = await getAnalyticsPages(
      normalized.startDate,
      normalized.endDate,
      limit,
      forceDemo
    );

    return NextResponse.json({
      success: true,
      range: normalized.label,
      totalViews,
      data: pages,
    });
  } catch (error) {
    console.error('[API Analytics Pages Error]:', error);
    return NextResponse.json({
      success: true,
      range: normalized.label,
      totalViews: 0,
      data: [],
    });
  }
}
