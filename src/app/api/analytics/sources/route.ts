import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/analytics-auth';
import { getAnalyticsSources, normalizeDateRange } from '@/lib/google-analytics';

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
    const data = await getAnalyticsSources(normalized.startDate, normalized.endDate, forceDemo);

    return NextResponse.json({
      success: true,
      range: normalized.label,
      data,
    });
  } catch (error) {
    console.error('[API Analytics Sources Error]:', error);
    return NextResponse.json({
      success: true,
      range: normalized.label,
      data: [],
    });
  }
}
