import { NextRequest } from 'next/server';
import { POST as handleGoogleFormWebhook } from '@/app/api/reviews/google-form/route';

export async function POST(req: NextRequest) {
  return handleGoogleFormWebhook(req);
}
