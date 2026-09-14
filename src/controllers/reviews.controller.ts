'use server';

/**
 * @file admin/src/controllers/reviews.controller.ts
 * @description [CONTROLLER] Business logic for managing, moderating, approving, and featuring client reviews.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminReview, ReviewStatus, AdminActionResponse } from '@/models/types';
import { Prisma } from '@prisma/client';

export interface GetReviewsParams {
  search?: string;
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Retrieves reviews with search, approval status, and featured filter support.
 */
export async function getReviews({
  search = '',
  status = 'all',
  featuredOnly = false,
  page = 1,
  limit = 50,
}: GetReviewsParams = {}): Promise<{ data: AdminReview[]; total: number; error?: string }> {
  try {
    const offset = (page - 1) * limit;

    // 1. Primary PostgreSQL via Prisma ORM
    try {
      const where: Prisma.ReviewWhereInput = {};

      if (status !== 'all') {
        where.status = status;
      }
      if (featuredOnly) {
        where.featured = true;
      }
      if (search.trim()) {
        where.OR = [
          { clientName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { projectName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { reviewText: { contains: search, mode: 'insensitive' } },
          { review: { contains: search, mode: 'insensitive' } },
          { sourceSubmissionId: { contains: search, mode: 'insensitive' } },
          { reviewId: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, records] = await Promise.all([
        db.review.count({ where }),
        db.review.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      const mapped: AdminReview[] = records.map((r) => ({
        id: r.id,
        source_submission_id: r.sourceSubmissionId || r.reviewId || null,
        review_id: r.reviewId || r.sourceSubmissionId || null,
        client_name: r.clientName,
        company_name: r.companyName || r.company || null,
        company: r.company || r.companyName || null,
        designation: r.designation || null,
        project_name: r.projectName || null,
        email: r.email || null,
        overall_service_rating: r.overallServiceRating,
        software_quality_rating: r.softwareQualityRating,
        communication_support_rating: r.communicationSupportRating,
        average_rating: Number(r.averageRating) || 5.0,
        display_rating: r.displayRating || r.rating || 5,
        rating: r.rating || r.displayRating || 5,
        liked_most: r.likedMost || null,
        would_recommend: r.wouldRecommend || null,
        improvement_feedback: r.improvementFeedback || null,
        original_review: r.originalReview || r.review || '',
        review_text: r.reviewText || r.review || '',
        review: r.reviewText || r.review || '',
        image_url: r.imageUrl || null,
        website_publish_permission: r.websitePublishPermission || null,
        can_publish_review: r.canPublishReview,
        identity_display_permission: r.identityDisplayPermission || 'Yes',
        status: r.status as ReviewStatus,
        featured: r.featured,
        admin_note: r.adminNote || null,
        submitted_at: r.submittedAt ? r.submittedAt.toISOString() : null,
        published_at: r.publishedAt ? r.publishedAt.toISOString() : null,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));

      return { data: mapped, total };
    } catch (prismaErr) {
      console.warn('[Admin Reviews Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Supabase Cloud Fallback
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseClient();
      let query = supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (featuredOnly) {
        query = query.eq('featured', true);
      }

      if (search.trim()) {
        query = query.or(
          `client_name.ilike.%${search}%,company_name.ilike.%${search}%,company.ilike.%${search}%,project_name.ilike.%${search}%,email.ilike.%${search}%,review_text.ilike.%${search}%,review.ilike.%${search}%`
        );
      }

      const { data, count, error } = await query.range(offset, offset + limit - 1);

      if (!error && data) {
        const mapped: AdminReview[] = data.map((r: any) => ({
          id: r.id,
          source_submission_id: r.source_submission_id || r.review_id || null,
          review_id: r.review_id || r.source_submission_id || null,
          client_name: r.client_name,
          company_name: r.company_name || r.company || null,
          company: r.company || r.company_name || null,
          designation: r.designation || null,
          project_name: r.project_name || null,
          email: r.email || null,
          overall_service_rating: r.overall_service_rating,
          software_quality_rating: r.software_quality_rating,
          communication_support_rating: r.communication_support_rating,
          average_rating: Number(r.average_rating) || 5.0,
          display_rating: r.display_rating || r.rating || 5,
          rating: r.rating || r.display_rating || 5,
          liked_most: r.liked_most || null,
          would_recommend: r.would_recommend || null,
          improvement_feedback: r.improvement_feedback || null,
          original_review: r.original_review || r.review || '',
          review_text: r.review_text || r.review || '',
          review: r.review_text || r.review || '',
          image_url: r.image_url || null,
          website_publish_permission: r.website_publish_permission || null,
          can_publish_review: Boolean(r.can_publish_review),
          identity_display_permission: r.identity_display_permission || 'Yes',
          status: r.status as ReviewStatus,
          featured: Boolean(r.featured),
          admin_note: r.admin_note || null,
          submitted_at: r.submitted_at || null,
          published_at: r.published_at || null,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));
        return { data: mapped, total: count || 0 };
      }
    }

    return { data: [], total: 0 };
  } catch (error) {
    console.error('[Get Reviews Controller Error]:', error);
    return { data: [], total: 0, error: 'Failed to fetch reviews' };
  }
}

/**
 * Approves a client review and makes it eligible for public display (subject to publication permission).
 */
export async function approveReview(id: string): Promise<AdminActionResponse> {
  try {
    const publishedAt = new Date();

    if (!isSupabaseConfigured()) {
      const review = await db.review.findUnique({ where: { id } });
      if (!review) return { success: false, error: 'Review not found' };

      await db.review.update({
        where: { id },
        data: {
          status: 'approved',
          publishedAt,
        },
      });
      revalidatePath('/reviews');
      revalidatePath('/dashboard');
      return {
        success: true,
        message: review.canPublishReview
          ? 'Review approved and published to client website.'
          : 'Approved internally — customer did not grant website publication permission.',
      };
    }

    const supabase = await createSupabaseClient();
    const { data: revData } = await supabase.from('reviews').select('can_publish_review').eq('id', id).single();

    const { error } = await supabase
      .from('reviews')
      .update({
        status: 'approved',
        published_at: publishedAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/reviews');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: revData?.can_publish_review
        ? 'Review approved and published to client website.'
        : 'Approved internally — customer did not grant website publication permission.',
    };
  } catch (error) {
    console.error('[Approve Review Error]:', error);
    return { success: false, error: 'Failed to approve review' };
  }
}

/**
 * Rejects a client review. Record remains in database as historical feedback.
 */
export async function rejectReview(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.review.update({
        where: { id },
        data: {
          status: 'rejected',
        },
      });
      revalidatePath('/reviews');
      revalidatePath('/dashboard');
      return { success: true, message: 'Review marked as rejected.' };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('reviews')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/reviews');
    revalidatePath('/dashboard');
    return { success: true, message: 'Review marked as rejected.' };
  } catch (error) {
    console.error('[Reject Review Error]:', error);
    return { success: false, error: 'Failed to reject review' };
  }
}

/**
 * Toggles whether an approved review is pinned as 'featured'.
 */
export async function toggleFeatureReview(id: string, featured: boolean): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.review.update({
        where: { id },
        data: { featured },
      });
      revalidatePath('/reviews');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('reviews')
      .update({
        featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/reviews');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Toggle Feature Review Error]:', error);
    return { success: false, error: 'Failed to toggle featured status' };
  }
}

/**
 * Updates metadata on a review record.
 * NOTE: original_review is NEVER overwritten; only review_text / review is editable.
 */
export async function updateReview(
  id: string,
  updates: Partial<Omit<AdminReview, 'id' | 'original_review' | 'created_at' | 'updated_at'>>
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      const updateData: Prisma.ReviewUpdateInput = {};
      if (updates.client_name) updateData.clientName = updates.client_name;
      if (updates.company_name !== undefined) {
        updateData.companyName = updates.company_name;
        updateData.company = updates.company_name;
      } else if (updates.company !== undefined) {
        updateData.company = updates.company;
        updateData.companyName = updates.company;
      }
      if (updates.designation !== undefined) updateData.designation = updates.designation;
      if (updates.project_name !== undefined) updateData.projectName = updates.project_name;
      
      // Update public review text (originalReview is immutable)
      if (updates.review_text !== undefined) {
        updateData.reviewText = updates.review_text;
        updateData.review = updates.review_text;
      } else if (updates.review !== undefined) {
        updateData.reviewText = updates.review;
        updateData.review = updates.review;
      }

      if (updates.status) updateData.status = updates.status;
      if (updates.featured !== undefined) updateData.featured = updates.featured;
      if (updates.admin_note !== undefined) updateData.adminNote = updates.admin_note;
      if (updates.image_url !== undefined) updateData.imageUrl = updates.image_url;

      await db.review.update({
        where: { id },
        data: updateData,
      });
      revalidatePath('/reviews');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.client_name) updatePayload.client_name = updates.client_name;
    if (updates.company_name !== undefined) updatePayload.company_name = updates.company_name;
    if (updates.company !== undefined) updatePayload.company = updates.company;
    if (updates.designation !== undefined) updatePayload.designation = updates.designation;
    if (updates.project_name !== undefined) updatePayload.project_name = updates.project_name;
    if (updates.review_text !== undefined) {
      updatePayload.review_text = updates.review_text;
      updatePayload.review = updates.review_text;
    } else if (updates.review !== undefined) {
      updatePayload.review_text = updates.review;
      updatePayload.review = updates.review;
    }
    if (updates.status) updatePayload.status = updates.status;
    if (updates.featured !== undefined) updatePayload.featured = updates.featured;
    if (updates.admin_note !== undefined) updatePayload.admin_note = updates.admin_note;
    if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url;

    const { error } = await supabase
      .from('reviews')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/reviews');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Update Review Error]:', error);
    return { success: false, error: 'Failed to update review' };
  }
}

/**
 * Permanently deletes a review.
 */
export async function deleteReview(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.review.delete({
        where: { id },
      });
      revalidatePath('/reviews');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('reviews').delete().eq('id', id);

    if (error) throw error;
    revalidatePath('/reviews');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Review Error]:', error);
    return { success: false, error: 'Failed to delete review' };
  }
}

export interface FormSubmissionInput {
  sourceSubmissionId?: string;
  clientName: string;
  companyName?: string;
  designation?: string;
  projectName?: string;
  email?: string;
  overallServiceRating?: number | null;
  softwareQualityRating?: number | null;
  communicationSupportRating?: number | null;
  testimonial: string;
  likedMost?: string;
  wouldRecommend?: string;
  improvementFeedback?: string;
  websitePublishPermission?: string;
  identityDisplayPermission?: string;
}

/**
 * Direct ingestion action for Google Form responses or manual submissions.
 */
export async function ingestFormSubmission(
  input: FormSubmissionInput
): Promise<AdminActionResponse & { review?: AdminReview }> {
  try {
    if (!input.clientName?.trim()) {
      return { success: false, error: 'Client name is required.' };
    }
    if (!input.testimonial?.trim()) {
      return { success: false, error: 'Testimonial text is required.' };
    }

    const sourceSubmissionId = input.sourceSubmissionId?.trim() || `sub_${Date.now()}`;

    // Duplicate check & insertion
    if (!isSupabaseConfigured()) {
      const existing = await db.review.findFirst({
        where: {
          OR: [{ sourceSubmissionId }, { reviewId: sourceSubmissionId }],
        },
      });

      if (existing) {
        return {
          success: true,
          message: 'Review already exists with this submission ID.',
          review: {
            id: existing.id,
            source_submission_id: existing.sourceSubmissionId || null,
            review_id: existing.reviewId || null,
            client_name: existing.clientName,
            company_name: existing.companyName || existing.company || null,
            company: existing.company || existing.companyName || null,
            designation: existing.designation || null,
            project_name: existing.projectName || null,
            email: existing.email || null,
            overall_service_rating: existing.overallServiceRating,
            software_quality_rating: existing.softwareQualityRating,
            communication_support_rating: existing.communicationSupportRating,
            average_rating: Number(existing.averageRating) || 5.0,
            display_rating: existing.displayRating || existing.rating || 5,
            rating: existing.rating || 5,
            liked_most: existing.likedMost || null,
            would_recommend: existing.wouldRecommend || null,
            improvement_feedback: existing.improvementFeedback || null,
            original_review: existing.originalReview || existing.review || '',
            review_text: existing.reviewText || existing.review || '',
            review: existing.reviewText || existing.review || '',
            image_url: existing.imageUrl || null,
            website_publish_permission: existing.websitePublishPermission || null,
            can_publish_review: existing.canPublishReview,
            identity_display_permission: existing.identityDisplayPermission || 'Yes',
            status: existing.status as ReviewStatus,
            featured: existing.featured,
            admin_note: existing.adminNote || null,
            submitted_at: existing.submittedAt ? existing.submittedAt.toISOString() : null,
            published_at: existing.publishedAt ? existing.publishedAt.toISOString() : null,
            created_at: existing.createdAt.toISOString(),
            updated_at: existing.updatedAt.toISOString(),
          },
        };
      }

      // Compute average rating
      const ratings = [
        input.overallServiceRating,
        input.softwareQualityRating,
        input.communicationSupportRating,
      ].filter((r): r is number => typeof r === 'number' && r >= 1 && r <= 5);

      let averageRating = 5.0;
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, curr) => acc + curr, 0);
        averageRating = parseFloat((sum / ratings.length).toFixed(2));
      }
      const displayRating = Math.min(5, Math.max(1, Math.round(averageRating)));

      const webPerm = (input.websitePublishPermission || '').trim();
      const canPublishReview =
        webPerm.toLowerCase() === 'yes' ||
        webPerm.toLowerCase().includes('permission to feature') ||
        webPerm.toLowerCase().includes('yes,') ||
        webPerm === 'Yes';

      const identityPerm = input.identityDisplayPermission?.trim() || 'Yes';

      const created = await db.review.create({
        data: {
          sourceSubmissionId,
          reviewId: sourceSubmissionId,
          clientName: input.clientName.trim(),
          companyName: input.companyName?.trim() || null,
          company: input.companyName?.trim() || null,
          designation: input.designation?.trim() || null,
          projectName: input.projectName?.trim() || null,
          email: input.email?.trim() || null,
          overallServiceRating: input.overallServiceRating || null,
          softwareQualityRating: input.softwareQualityRating || null,
          communicationSupportRating: input.communicationSupportRating || null,
          averageRating: new Prisma.Decimal(averageRating),
          displayRating,
          rating: displayRating,
          likedMost: input.likedMost?.trim() || null,
          wouldRecommend: input.wouldRecommend?.trim() || null,
          improvementFeedback: input.improvementFeedback?.trim() || null,
          originalReview: input.testimonial.trim(),
          reviewText: input.testimonial.trim(),
          review: input.testimonial.trim(),
          websitePublishPermission: webPerm || 'Yes',
          canPublishReview,
          identityDisplayPermission: identityPerm,
          status: 'pending',
          featured: false,
          submittedAt: new Date(),
        },
      });

      revalidatePath('/reviews');
      revalidatePath('/dashboard');

      return {
        success: true,
        message: 'Google Form submission ingested successfully into pending moderation queue.',
        review: {
          id: created.id,
          source_submission_id: created.sourceSubmissionId || null,
          review_id: created.reviewId || null,
          client_name: created.clientName,
          company_name: created.companyName || created.company || null,
          company: created.company || created.companyName || null,
          designation: created.designation || null,
          project_name: created.projectName || null,
          email: created.email || null,
          overall_service_rating: created.overallServiceRating,
          software_quality_rating: created.softwareQualityRating,
          communication_support_rating: created.communicationSupportRating,
          average_rating: Number(created.averageRating) || 5.0,
          display_rating: created.displayRating || created.rating || 5,
          rating: created.rating || 5,
          liked_most: created.likedMost || null,
          would_recommend: created.wouldRecommend || null,
          improvement_feedback: created.improvementFeedback || null,
          original_review: created.originalReview || created.review || '',
          review_text: created.reviewText || created.review || '',
          review: created.reviewText || created.review || '',
          image_url: created.imageUrl || null,
          website_publish_permission: created.websitePublishPermission || null,
          can_publish_review: created.canPublishReview,
          identity_display_permission: created.identityDisplayPermission || 'Yes',
          status: created.status as ReviewStatus,
          featured: created.featured,
          admin_note: created.adminNote || null,
          submitted_at: created.submittedAt ? created.submittedAt.toISOString() : null,
          published_at: created.publishedAt ? created.publishedAt.toISOString() : null,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
        },
      };
    }

    return { success: false, error: 'Database not initialized.' };
  } catch (error) {
    console.error('[Ingest Form Submission Error]:', error);
    return {
      success: false,
      error: (error as Error)?.message || 'Failed to ingest form submission.',
    };
  }
}

