'use server';

/**
 * @file admin/src/controllers/enquiries.controller.ts
 * @description [CONTROLLER] Business logic for managing client inquiries, leads, and contact submissions.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminEnquiry, EnquiryStatus, AdminActionResponse } from '@/models/types';
import { Prisma } from '@prisma/client';

export interface GetEnquiriesParams {
  search?: string;
  status?: 'all' | 'pending' | 'contacted' | 'closed' | 'spam';
  page?: number;
  limit?: number;
}

/**
 * Retrieves paginated client inquiries with optional search and status filtering.
 */
export async function getEnquiries({
  search = '',
  status = 'all',
  page = 1,
  limit = 50,
}: GetEnquiriesParams = {}): Promise<{ data: AdminEnquiry[]; total: number; error?: string }> {
  try {
    const offset = (page - 1) * limit;

    // 1. Primary PostgreSQL Engine via Prisma ORM
    if (!isSupabaseConfigured()) {
      const where: Prisma.ContactSubmissionWhereInput = {};

      if (status !== 'all') {
        where.status = status;
      }

      if (search.trim()) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { service: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, records] = await Promise.all([
        db.contactSubmission.count({ where }),
        db.contactSubmission.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      const mapped: AdminEnquiry[] = records.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        company: r.company,
        phone: r.phone,
        service: r.service,
        message: r.message,
        status: r.status as EnquiryStatus,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));

      return { data: mapped, total };
    }

    // 2. Supabase Cloud Fallback
    const supabase = await createSupabaseClient();
    let query = supabase
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,service.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: (data as AdminEnquiry[]) || [], total: count || 0 };
  } catch (error) {
    console.error('[Get Enquiries Controller Error]:', error);
    return { data: [], total: 0, error: 'Failed to fetch enquiries' };
  }
}

/**
 * Updates status of a client enquiry (pending, contacted, closed, spam).
 */
export async function updateEnquiryStatus(
  id: string,
  newStatus: EnquiryStatus
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.contactSubmission.update({
        where: { id },
        data: { status: newStatus },
      });
      revalidatePath('/enquiries');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/enquiries');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Update Enquiry Status Error]:', error);
    return { success: false, error: 'Failed to update enquiry status' };
  }
}

/**
 * Permanently deletes an enquiry record.
 */
export async function deleteEnquiry(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.contactSubmission.delete({
        where: { id },
      });
      revalidatePath('/enquiries');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('contact_submissions').delete().eq('id', id);

    if (error) throw error;
    revalidatePath('/enquiries');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Enquiry Error]:', error);
    return { success: false, error: 'Failed to delete enquiry' };
  }
}
