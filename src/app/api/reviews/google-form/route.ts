import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/models/db';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function sanitizeText(val: unknown, maxLength = 5000): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLength);
}

function parseRating(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  if (Number.isFinite(num) && num >= 1 && num <= 5) {
    return Math.round(num);
  }
  return null;
}

interface FormPayload {
  [key: string]: unknown;
  clientName?: string;
  client_name?: string;
  companyName?: string;
  company_name?: string;
  company?: string;
  designation?: string;
  projectName?: string;
  project_name?: string;
  email?: string;
  Email?: string;
  ratings?: {
    overallService?: unknown;
    softwareQuality?: unknown;
    communicationSupport?: unknown;
    [key: string]: unknown;
  };
  overall_service_rating?: unknown;
  overallService?: unknown;
  software_quality_rating?: unknown;
  softwareQuality?: unknown;
  communication_support_rating?: unknown;
  communicationSupport?: unknown;
  averageRating?: unknown;
  average_rating?: unknown;
  rating?: unknown;
  likedMost?: string;
  liked_most?: string;
  wouldRecommend?: string;
  would_recommend?: string;
  improvementFeedback?: string;
  improvement_feedback?: string;
  testimonial?: string;
  review?: string;
  original_review?: string;
  originalReview?: string;
  permissions?: {
    websitePublishing?: string;
    identityDisplay?: string;
    [key: string]: unknown;
  };
  websitePublishPermission?: string;
  website_publish_permission?: string;
  identityDisplayPermission?: string;
  identity_display_permission?: string;
  sourceSubmissionId?: string;
  source_submission_id?: string;
  review_id?: string;
  reviewId?: string;
  submittedAt?: string;
  submitted_at?: string;
  timestamp?: string;
  Timestamp?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate webhook secret from headers only (reject secrets in query params to prevent log exposure)
    const secret =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    const expectedSecret =
      process.env.GOOGLE_FORM_WEBHOOK_SECRET ||
      process.env.GOOGLE_SHEET_WEBHOOK_SECRET ||
      (process.env.NODE_ENV !== 'production' ? 'astraiv_gsheet_webhook_secret_2026' : '');

    if (!secret || !expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing webhook secret token.' },
        { status: 401 }
      );
    }

    const secretBuffer = Buffer.from(secret);
    const expectedBuffer = Buffer.from(expectedSecret);
    const isAuthorized =
      secretBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(secretBuffer, expectedBuffer);

    if (!isAuthorized) {
      console.warn('[Webhook Auth Warning]: Unauthorized attempt to access Admin Google Form webhook route.');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing webhook secret token.' },
        { status: 401 }
      );
    }

    // 2. Parse payload
    let payload: FormPayload;
    try {
      payload = (await req.json()) as FormPayload;
    } catch {
      return NextResponse.json(
        { error: 'Bad Request: Invalid JSON payload.' },
        { status: 400 }
      );
    }

    // 3. Extract and normalize fields
    const clientName = sanitizeText(payload.clientName ?? payload.client_name ?? payload['Your Name :']);
    const companyName = sanitizeText(
      payload.companyName ?? payload.company_name ?? payload.company ?? payload['Your Company / Organization  Name :'] ?? payload['Your Company / Organization Name :']
    );
    const designation = sanitizeText(payload.designation ?? payload['Your Designation :']);
    const projectName = sanitizeText(payload.projectName ?? payload.project_name ?? payload['  Project Name :  '] ?? payload['Project Name :']);
    const email = sanitizeText(payload.email ?? payload.Email ?? payload['Email Address']);

    // Ratings
    const rawOverallService =
      payload.ratings?.overallService ??
      payload.overall_service_rating ??
      payload.overallService ??
      payload['  How would you rate our overall service?  '] ??
      payload['How would you rate our overall service?'];

    const rawSoftwareQuality =
      payload.ratings?.softwareQuality ??
      payload.software_quality_rating ??
      payload.softwareQuality ??
      payload['How satisfied are you with the quality of the software / Project that we delivered to you?  '] ??
      payload['How satisfied are you with the quality of the software / Project that we delivered to you?'];

    const rawCommunicationSupport =
      payload.ratings?.communicationSupport ??
      payload.communication_support_rating ??
      payload.communicationSupport ??
      payload['How satisfied are you with communication and support of ASTRAIV?  '] ??
      payload['How satisfied are you with communication and support of ASTRAIV?'];

    const overallServiceRating = parseRating(rawOverallService);
    const softwareQualityRating = parseRating(rawSoftwareQuality);
    const communicationSupportRating = parseRating(rawCommunicationSupport);

    // 4. Server-side Recalculation of Average & Display Rating
    const validRatings: number[] = [];
    if (overallServiceRating !== null) validRatings.push(overallServiceRating);
    if (softwareQualityRating !== null) validRatings.push(softwareQualityRating);
    if (communicationSupportRating !== null) validRatings.push(communicationSupportRating);

    let averageRating = 5.0;
    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
      averageRating = Number((sum / validRatings.length).toFixed(2));
    } else if (payload.averageRating || payload.average_rating || payload.rating) {
      const fallbackRating = Number(payload.averageRating || payload.average_rating || payload.rating);
      if (Number.isFinite(fallbackRating) && fallbackRating >= 1 && fallbackRating <= 5) {
        averageRating = Number(fallbackRating.toFixed(2));
      }
    }

    const displayRating = Math.min(5, Math.max(1, Math.round(averageRating)));

    // Additional questions
    const likedMost = sanitizeText(
      payload.likedMost ?? payload.liked_most ?? payload['What did you like most about working with us?  '] ?? payload['What did you like most about working with us?']
    );
    const wouldRecommend = sanitizeText(
      payload.wouldRecommend ?? payload.would_recommend ?? payload['Would you recommend Astraiv Technologies to others?  '] ?? payload['Would you recommend Astraiv Technologies to others?']
    );
    const improvementFeedback = sanitizeText(
      payload.improvementFeedback ??
      payload.improvement_feedback ??
      payload['Please suggest us how we can serve you better next time, below -']
    );

    // Testimonial
    const testimonial = sanitizeText(
      payload.testimonial ??
      payload.review ??
      payload.original_review ??
      payload.originalReview ??
      payload['Please share your experience working with Astraiv Technologies.  '] ??
      payload['Please share your experience working with Astraiv Technologies.']
    );

    // Permissions
    const websitePublishPermission = sanitizeText(
      payload.permissions?.websitePublishing ??
      payload.websitePublishPermission ??
      payload.website_publish_permission ??
      payload['May we display your feedback on our website (www.astraivtechnologies.com)?  '] ??
      payload['May we display your feedback on our website (www.astraivtechnologies.com)?']
    );

    const canPublishReview =
      websitePublishPermission.toLowerCase().includes('yes') ||
      websitePublishPermission.toLowerCase().includes('publish');

    const identityDisplayPermission = sanitizeText(
      payload.permissions?.identityDisplay ??
      payload.identityDisplayPermission ??
      payload.identity_display_permission ??
      payload['May we display your name and company along with your review?  '] ??
      payload['May we display your name and company along with your review?'] ??
      'Yes'
    );

    // Source submission ID
    const sourceSubmissionId = sanitizeText(
      payload.sourceSubmissionId ??
      payload.source_submission_id ??
      payload.review_id ??
      payload.reviewId ??
      `GF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    );

    // Timestamps
    const rawSubmittedAt = payload.submittedAt ?? payload.submitted_at ?? payload.timestamp ?? payload.Timestamp;
    const submittedAt = rawSubmittedAt ? new Date(rawSubmittedAt) : new Date();

    // 5. Validation of mandatory fields
    if (!clientName) {
      return NextResponse.json(
        { error: 'Validation Error: client_name is required.' },
        { status: 400 }
      );
    }
    
    // Resilient fallback if client left testimonial text blank
    const effectiveTestimonial = testimonial || likedMost || improvementFeedback || `Client provided a ${displayRating}-star rating for Astraiv Technologies.`;

    // 6. Duplicate Protection via source_submission_id
    try {
      // Check by source submission ID or existing pending record with same client name
      const existing = await db.review.findFirst({
        where: {
          OR: [
            { sourceSubmissionId },
            { reviewId: sourceSubmissionId },
            {
              clientName: { equals: clientName, mode: 'insensitive' },
              status: 'pending',
            },
          ],
        },
      });

      if (existing) {
        // If the review is still pending, update it with the exact fresh submission data
        if (existing.status === 'pending') {
          // If the admin hasn't edited the text yet, sync the exact client submission
          const isAdminEdited = existing.reviewText !== existing.originalReview;
          const updated = await db.review.update({
            where: { id: existing.id },
            data: {
              sourceSubmissionId,
              clientName,
              companyName: companyName || existing.companyName,
              company: companyName || existing.company,
              designation: designation || existing.designation,
              projectName: projectName || existing.projectName,
              email: email || existing.email,
              overallServiceRating,
              softwareQualityRating,
              communicationSupportRating,
              averageRating: new Prisma.Decimal(averageRating),
              displayRating,
              rating: displayRating,
              likedMost: likedMost || existing.likedMost,
              wouldRecommend: wouldRecommend || existing.wouldRecommend,
              improvementFeedback: improvementFeedback || existing.improvementFeedback,
              originalReview: effectiveTestimonial,
              reviewText: isAdminEdited ? existing.reviewText : effectiveTestimonial,
              review: isAdminEdited ? existing.reviewText : effectiveTestimonial,
              websitePublishPermission: websitePublishPermission || existing.websitePublishPermission,
              canPublishReview,
              identityDisplayPermission: identityDisplayPermission || existing.identityDisplayPermission,
            },
          });

          console.log(`[Google Form Webhook Admin]: Updated pending review ID ${updated.id} with exact submission.`);
          return NextResponse.json(
            {
              success: true,
              message: 'Review record updated with latest submission details.',
              id: updated.id,
              status: 'pending',
            },
            { status: 200 }
          );
        }

        console.log(`[Google Form Webhook Admin]: Non-pending review ignored for source_submission_id: ${sourceSubmissionId}`);
        return NextResponse.json(
          {
            success: true,
            message: 'Review has already been moderated/processed.',
            skipped: true,
            id: existing.id,
            sourceSubmissionId,
          },
          { status: 200 }
        );
      }
    } catch (checkErr) {
      console.warn('[Google Form Admin Duplicate Check Warning]:', (checkErr as Error)?.message || checkErr);
    }

    // 7. Insert into PostgreSQL via Prisma
    try {
      const created = await db.review.create({
        data: {
          sourceSubmissionId,
          reviewId: sourceSubmissionId,
          clientName,
          companyName: companyName || null,
          company: companyName || null,
          designation: designation || null,
          projectName: projectName || null,
          email: email || null,
          overallServiceRating,
          softwareQualityRating,
          communicationSupportRating,
          averageRating: new Prisma.Decimal(averageRating),
          displayRating,
          rating: displayRating,
          likedMost: likedMost || null,
          wouldRecommend: wouldRecommend || null,
          improvementFeedback: improvementFeedback || null,
          originalReview: effectiveTestimonial,
          reviewText: effectiveTestimonial,
          review: effectiveTestimonial,
          imageUrl: sanitizeText(payload.imageUrl ?? payload.image_url) || null,
          websitePublishPermission: websitePublishPermission || null,
          canPublishReview,
          identityDisplayPermission: identityDisplayPermission || 'Yes',
          status: 'pending',
          featured: false,
          adminNote: null,
          submittedAt,
        },
      });

      console.log(`[Google Form Webhook Admin]: Successfully saved review ID ${created.id}`);

      return NextResponse.json(
        {
          success: true,
          message: 'Review received and queued for admin moderation.',
          id: created.id,
          averageRating,
          displayRating,
          canPublishReview,
          status: 'pending',
        },
        { status: 201 }
      );
    } catch (dbErr) {
      console.error('[Google Form Webhook Admin DB Error]:', dbErr);

      if (isSupabaseConfigured()) {
        try {
          const supabase = await createSupabaseClient();
          const { data, error } = await supabase
            .from('reviews')
            .insert({
              source_submission_id: sourceSubmissionId,
              review_id: sourceSubmissionId,
              client_name: clientName,
              company_name: companyName || null,
              company: companyName || null,
              designation: designation || null,
              project_name: projectName || null,
              email: email || null,
              overall_service_rating: overallServiceRating,
              software_quality_rating: softwareQualityRating,
              communication_support_rating: communicationSupportRating,
              average_rating: averageRating,
              display_rating: displayRating,
              rating: displayRating,
              liked_most: likedMost || null,
              would_recommend: wouldRecommend || null,
              improvement_feedback: improvementFeedback || null,
              original_review: effectiveTestimonial,
              review_text: effectiveTestimonial,
              review: effectiveTestimonial,
              website_publish_permission: websitePublishPermission || null,
              can_publish_review: canPublishReview,
              identity_display_permission: identityDisplayPermission || 'Yes',
              status: 'pending',
              featured: false,
              submitted_at: submittedAt.toISOString(),
            })
            .select()
            .single();

          if (!error && data) {
            return NextResponse.json(
              {
                success: true,
                message: 'Review received and queued for admin moderation via cloud storage.',
                id: data.id,
                averageRating,
                displayRating,
                canPublishReview,
                status: 'pending',
              },
              { status: 201 }
            );
          }
        } catch (supaErr) {
          console.error('[Google Form Webhook Admin Supabase Fallback Error]:', supaErr);
        }
      }

      return NextResponse.json(
        { error: 'Internal Server Error: Failed to save review to database.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Google Form Webhook Admin Unhandled Exception]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error processing feedback submission.' },
      { status: 500 }
    );
  }
}
