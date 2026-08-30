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
    if (!isSupabaseConfigured()) {
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
          { company: { contains: search, mode: 'insensitive' } },
          { review: { contains: search, mode: 'insensitive' } },
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
        review_id: r.reviewId,
        client_name: r.clientName,
        company: r.company,
        designation: r.designation,
        review: r.review,
        rating: r.rating,
        image_url: r.imageUrl,
        status: r.status as ReviewStatus,
        featured: r.featured,
        admin_note: r.adminNote,
        published_at: r.publishedAt ? r.publishedAt.toISOString() : null,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));

      return { data: mapped, total };
    }

    // 2. Supabase Cloud Fallback
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
        `client_name.ilike.%${search}%,company.ilike.%${search}%,review.ilike.%${search}%,review_id.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: (data as AdminReview[]) || [], total: count || 0 };
  } catch (error) {
    console.error('[Get Reviews Controller Error]:', error);
    return { data: [], total: 0, error: 'Failed to fetch reviews' };
  }
}

/**
 * Approves a client review and makes it eligible for public display.
 */
export async function approveReview(id: string): Promise<AdminActionResponse> {
  try {
    const publishedAt = new Date();

    if (!isSupabaseConfigured()) {
      await db.review.update({
        where: { id },
        data: {
          status: 'approved',
          publishedAt,
        },
      });
      revalidatePath('/reviews');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
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
    return { success: true };
  } catch (error) {
    console.error('[Approve Review Error]:', error);
    return { success: false, error: 'Failed to approve review' };
  }
}

/**
 * Rejects a client review.
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
      return { success: true };
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
    return { success: true };
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
 */
export async function updateReview(
  id: string,
  updates: Partial<Omit<AdminReview, 'id' | 'created_at' | 'updated_at'>>
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      const updateData: Prisma.ReviewUpdateInput = {};
      if (updates.client_name) updateData.clientName = updates.client_name;
      if (updates.company !== undefined) updateData.company = updates.company;
      if (updates.designation !== undefined) updateData.designation = updates.designation;
      if (updates.review) updateData.review = updates.review;
      if (updates.rating) updateData.rating = updates.rating;
      if (updates.status) updateData.status = updates.status;
      if (updates.featured !== undefined) updateData.featured = updates.featured;
      if (updates.admin_note !== undefined) updateData.adminNote = updates.admin_note;

      await db.review.update({
        where: { id },
        data: updateData,
      });
      revalidatePath('/reviews');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('reviews')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
