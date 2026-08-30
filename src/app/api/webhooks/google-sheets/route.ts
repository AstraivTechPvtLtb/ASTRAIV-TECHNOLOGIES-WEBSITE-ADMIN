import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/models/db';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret') || req.headers.get('x-webhook-secret');
    const expectedSecret = process.env.GOOGLE_SHEET_WEBHOOK_SECRET || 'astraiv_gsheet_webhook_secret_2026';

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook payload' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      client_name,
      company,
      designation,
      review,
      rating = 5,
      review_id,
      image_url,
    } = payload;

    if (!client_name || !review) {
      return NextResponse.json({ error: 'Missing required client_name or review text' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const created = await db.review.create({
        data: {
          clientName: client_name,
          company: company || null,
          designation: designation || null,
          review,
          rating: Number(rating) || 5,
          reviewId: review_id || `gsheet-${Date.now()}`,
          imageUrl: image_url || null,
          status: 'pending',
          featured: false,
        },
      });

      return NextResponse.json({ success: true, id: created.id }, { status: 201 });
    }

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        client_name,
        company: company || null,
        designation: designation || null,
        review,
        rating: Number(rating) || 5,
        review_id: review_id || `gsheet-${Date.now()}`,
        image_url: image_url || null,
        status: 'pending',
        featured: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('[Google Sheets Webhook Ingestion Error]:', error);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
