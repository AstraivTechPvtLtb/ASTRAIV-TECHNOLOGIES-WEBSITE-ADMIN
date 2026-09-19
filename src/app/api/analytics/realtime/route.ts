import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/analytics-auth';
import { getAnalyticsRealtime } from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = req.nextUrl;
    const forceDemo = searchParams.get('demo') === 'true';

    const data = await getAnalyticsRealtime(forceDemo);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (error) {
    console.error('[API Analytics Realtime Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || 'Failed to fetch real-time analytics.',
      },
      { status: 500 }
    );
  }
}
