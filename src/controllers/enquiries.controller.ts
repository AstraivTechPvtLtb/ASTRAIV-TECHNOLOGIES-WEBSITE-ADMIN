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
import { requireAdminUser } from './auth.controller';

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
    await requireAdminUser();
    const offset = (page - 1) * limit;

    // 1. Primary PostgreSQL Engine via Prisma ORM
    try {
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
    } catch (prismaErr) {
      console.warn('[Admin Enquiries Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Supabase Cloud Fallback
    if (isSupabaseConfigured()) {
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
    }

    return { data: [], total: 0 };
  } catch (error) {
    console.error('[Get Enquiries Controller Error]:', (error as Error)?.message || error);
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
    await requireAdminUser();
    try {
      await db.contactSubmission.update({
        where: { id },
        data: { status: newStatus },
      });
      revalidatePath('/enquiries');
      revalidatePath('/dashboard');
      return { success: true };
    } catch (prismaErr) {
      if (!isSupabaseConfigured()) throw prismaErr;
      console.warn('[Update Enquiry Status Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
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
    console.error('[Update Enquiry Status Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to update enquiry status' };
  }
}

/**
 * Permanently deletes an enquiry record.
 */
export async function deleteEnquiry(id: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    try {
      await db.contactSubmission.delete({
        where: { id },
      });
      revalidatePath('/enquiries');
      revalidatePath('/dashboard');
      return { success: true };
    } catch (prismaErr) {
      if (!isSupabaseConfigured()) throw prismaErr;
      console.warn('[Delete Enquiry Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('contact_submissions').delete().eq('id', id);

    if (error) throw error;
    revalidatePath('/enquiries');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Enquiry Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to delete enquiry' };
  }
}

export interface EnquiryNotificationItem {
  id: string;
  service: string;
  createdAt: string;
}

export interface PollEnquiriesResponse {
  hasNew: boolean;
  count: number;
  latestTimestamp: string | null;
  latestId?: string | null;
  compoundCursor?: string | null;
  newEnquiries: EnquiryNotificationItem[];
  error?: string;
}

/**
 * Lightweight, admin-authenticated enquiry polling action with deterministic compound-cursor pagination.
 * Returns only non-sensitive event identifiers, service labels, and timestamps.
 * Raw PII (names, emails, phone numbers, messages) is never exposed.
 */
export async function pollNewEnquiries(
  since?: string
): Promise<PollEnquiriesResponse> {
  try {
    await requireAdminUser();

    let sinceDate: Date | null = null;
    let lastId: string | null = null;

    if (since) {
      if (since.includes('|')) {
        const [tPart, idPart] = since.split('|');
        const parsedDate = new Date(tPart);
        if (!isNaN(parsedDate.getTime())) {
          sinceDate = parsedDate;
          lastId = idPart?.trim() || null;
        }
      } else {
        const parsedDate = new Date(since);
        if (!isNaN(parsedDate.getTime())) {
          sinceDate = parsedDate;
        }
      }
    }

    if (!sinceDate) {
      sinceDate = new Date();
    }

    // 1. Primary PostgreSQL Engine via Prisma ORM
    try {
      // Deterministic compound cursor: (createdAt > sinceDate) OR (createdAt == sinceDate AND id > lastId)
      const where: Prisma.ContactSubmissionWhereInput = lastId
        ? {
            OR: [
              { createdAt: { gt: sinceDate } },
              { createdAt: sinceDate, id: { gt: lastId } },
            ],
          }
        : {
            createdAt: { gte: sinceDate },
          };

      const [count, records] = await Promise.all([
        db.contactSubmission.count({ where }),
        db.contactSubmission.findMany({
          where,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 50,
          select: {
            id: true,
            service: true,
            createdAt: true,
          },
        }),
      ]);

      const newEnquiries: EnquiryNotificationItem[] = records.map((r) => ({
        id: r.id,
        service: r.service,
        createdAt: r.createdAt.toISOString(),
      }));

      const latestRecord = records.length > 0 ? records[records.length - 1] : null;
      const latestTimestamp = latestRecord ? latestRecord.createdAt.toISOString() : null;
      const latestId = latestRecord ? latestRecord.id : null;
      const compoundCursor = latestRecord ? `${latestTimestamp}|${latestId}` : null;

      return {
        hasNew: count > 0,
        count,
        latestTimestamp,
        latestId,
        compoundCursor,
        newEnquiries,
      };
    } catch (prismaErr) {
      console.warn('[Poll Enquiries Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Supabase Cloud Fallback
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseClient();
      let query = supabase
        .from('contact_submissions')
        .select('id, service, created_at', { count: 'exact' });

      if (lastId && sinceDate) {
        query = query.or(
          `created_at.gt.${sinceDate.toISOString()},and(created_at.eq.${sinceDate.toISOString()},id.gt.${lastId})`
        );
      } else {
        query = query.gte('created_at', sinceDate.toISOString());
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(50);

      if (error) throw error;

      const records = data || [];
      const newEnquiries: EnquiryNotificationItem[] = records.map((r) => ({
        id: r.id,
        service: r.service || 'General Inquiry',
        createdAt: r.created_at,
      }));

      const latestRecord = records.length > 0 ? records[records.length - 1] : null;
      const latestTimestamp = latestRecord ? latestRecord.created_at : null;
      const latestId = latestRecord ? latestRecord.id : null;
      const compoundCursor = latestRecord ? `${latestTimestamp}|${latestId}` : null;

      return {
        hasNew: (count || 0) > 0,
        count: count || 0,
        latestTimestamp,
        latestId,
        compoundCursor,
        newEnquiries,
      };
    }

    return {
      hasNew: false,
      count: 0,
      latestTimestamp: null,
      latestId: null,
      compoundCursor: null,
      newEnquiries: [],
    };
  } catch (error) {
    console.error('[Poll Enquiries Controller Error]:', (error as Error)?.message || error);
    return {
      hasNew: false,
      count: 0,
      latestTimestamp: null,
      latestId: null,
      compoundCursor: null,
      newEnquiries: [],
      error: 'Failed to poll enquiries',
    };
  }
}
