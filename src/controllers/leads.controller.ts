'use server';

/**
 * @file admin/src/controllers/leads.controller.ts
 * @description [CONTROLLER] Business logic for managing prospective enterprise project leads,
 * lifecycle progression (NEW -> QUALIFIED -> CONTACTED -> PROPOSAL -> NEGOTIATION -> WON / LOST),
 * team assignment, and source page attribution analytics.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import {
  AdminLead,
  LeadLifecycleStatus,
  AdminActionResponse,
  AdminLeadAnalytics,
} from '@/models/types';
import { Prisma } from '@prisma/client';

export interface GetLeadsParams {
  search?: string;
  status?: 'all' | LeadLifecycleStatus;
  sourcePage?: string;
  page?: number;
  limit?: number;
}

/**
 * Retrieves paginated leads with full lifecycle, attribution, and search filtering.
 */
export async function getLeads({
  search = '',
  status = 'all',
  sourcePage = '',
  page = 1,
  limit = 50,
}: GetLeadsParams = {}): Promise<{ data: AdminLead[]; total: number; error?: string }> {
  try {
    const offset = (page - 1) * limit;

    // 1. Primary PostgreSQL Engine via Prisma ORM
    if (!isSupabaseConfigured()) {
      const where: Prisma.CRMLeadWhereInput = {};

      if (status !== 'all') {
        where.status = status;
      }

      if (sourcePage.trim()) {
        where.sourcePage = { contains: sourcePage.trim(), mode: 'insensitive' };
      }

      if (search.trim()) {
        where.OR = [
          { leadNumber: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { sourcePage: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, records] = await Promise.all([
        db.cRMLead.count({ where }),
        db.cRMLead.findMany({
          where,
          include: {
            assignedUser: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      const mapped: AdminLead[] = records.map((r) => ({
        id: r.id,
        lead_number: r.leadNumber || 'AST-LEAD-PENDING',
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company,
        service_id: r.serviceId,
        solution_id: r.solutionId,
        industry_id: r.industryId,
        project_description: r.projectDescription,
        budget_range: r.budgetRange,
        timeline: r.timeline,
        source_page: r.sourcePage,
        utm_source: r.utmSource,
        utm_medium: r.utmMedium,
        utm_campaign: r.utmCampaign,
        status: (r.status as LeadLifecycleStatus) || 'NEW',
        assigned_to: r.assignedTo,
        assigned_user_name: r.assignedUser?.name || null,
        notes: r.notes,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }));

      return { data: mapped, total };
    }

    // 2. Supabase Cloud Fallback
    const supabase = await createSupabaseClient();
    let query = supabase
      .from('crm_lead')
      .select('*, user:assigned_to(name, email)', { count: 'exact' })
      .order('createdAt', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (sourcePage.trim()) {
      query = query.ilike('source_page', `%${sourcePage.trim()}%`);
    }

    if (search.trim()) {
      query = query.or(
        `lead_number.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,source_page.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    const mapped: AdminLead[] = (data || []).map((r: any) => ({
      id: r.id,
      lead_number: r.lead_number || 'AST-LEAD-PENDING',
      name: r.name,
      email: r.email,
      phone: r.phone,
      company: r.company,
      service_id: r.service_id,
      solution_id: r.solution_id,
      industry_id: r.industry_id,
      project_description: r.project_description,
      budget_range: r.budget_range,
      timeline: r.timeline,
      source_page: r.source_page,
      utm_source: r.utm_source,
      utm_medium: r.utm_medium,
      utm_campaign: r.utm_campaign,
      status: (r.status as LeadLifecycleStatus) || 'NEW',
      assigned_to: r.assigned_to,
      assigned_user_name: r.user?.name || null,
      notes: r.notes,
      created_at: r.createdAt || r.created_at,
      updated_at: r.updatedAt || r.updated_at,
    }));

    return { data: mapped, total: count || 0 };
  } catch (error) {
    console.error('[Get Leads Controller Error]:', error);
    return { data: [], total: 0, error: 'Failed to fetch leads' };
  }
}

/**
 * Updates status of a lead through the recommended 7-stage lifecycle:
 * NEW -> QUALIFIED -> CONTACTED -> PROPOSAL -> NEGOTIATION -> WON / LOST
 */
export async function updateLeadStatus(
  id: string,
  newStatus: LeadLifecycleStatus
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.cRMLead.update({
        where: { id },
        data: { status: newStatus },
      });
      revalidatePath('/leads');
      revalidatePath('/dashboard');
      revalidatePath('/enquiries');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('crm_lead')
      .update({ status: newStatus, updatedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/leads');
    revalidatePath('/dashboard');
    revalidatePath('/enquiries');
    return { success: true };
  } catch (error) {
    console.error('[Update Lead Status Error]:', error);
    return { success: false, error: 'Failed to update lead lifecycle status' };
  }
}

/**
 * Assigns a lead to an Astraiv solutions architect or team member.
 */
export async function assignLead(
  id: string,
  assignedTo: string | null
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.cRMLead.update({
        where: { id },
        data: { assignedTo },
      });
      revalidatePath('/leads');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('crm_lead')
      .update({ assigned_to: assignedTo, updatedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/leads');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Assign Lead Error]:', error);
    return { success: false, error: 'Failed to assign lead' };
  }
}

/**
 * Appends or edits internal administrative notes for a lead.
 */
export async function updateLeadNotes(id: string, notes: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.cRMLead.update({
        where: { id },
        data: { notes },
      });
      revalidatePath('/leads');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('crm_lead')
      .update({ notes, updatedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/leads');
    return { success: true };
  } catch (error) {
    console.error('[Update Lead Notes Error]:', error);
    return { success: false, error: 'Failed to update lead notes' };
  }
}

/**
 * Permanently deletes a lead record.
 */
export async function deleteLead(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.cRMLead.delete({
        where: { id },
      });
      revalidatePath('/leads');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('crm_lead').delete().eq('id', id);

    if (error) throw error;
    revalidatePath('/leads');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Lead Error]:', error);
    return { success: false, error: 'Failed to delete lead' };
  }
}

/**
 * Computes live lead analytics, status funnel breakdown, conversion rate,
 * and top source pages to determine which pages generate the most leads.
 */
export async function getLeadsAnalytics(): Promise<AdminLeadAnalytics> {
  const defaultAnalytics: AdminLeadAnalytics = {
    totalLeads: 0,
    statusBreakdown: {
      NEW: 0,
      QUALIFIED: 0,
      CONTACTED: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0,
    },
    conversionRate: 0,
    topSourcePages: [],
  };

  try {
    let records: Array<{ status: string; sourcePage: string | null }> = [];

    if (!isSupabaseConfigured()) {
      const dbRecords = await db.cRMLead.findMany({
        select: { status: true, sourcePage: true },
      });
      records = dbRecords.map((r) => ({
        status: r.status,
        sourcePage: r.sourcePage,
      }));
    } else {
      const supabase = await createSupabaseClient();
      const { data } = await supabase.from('crm_lead').select('status, source_page');
      records = (data || []).map((r: any) => ({
        status: r.status,
        sourcePage: r.source_page,
      }));
    }

    const breakdown: Record<LeadLifecycleStatus, number> = {
      NEW: 0,
      QUALIFIED: 0,
      CONTACTED: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0,
    };

    const sourcePageCounts = new Map<string, { count: number; wonCount: number }>();

    for (const r of records) {
      const st = (r.status as LeadLifecycleStatus) || 'NEW';
      if (breakdown[st] !== undefined) {
        breakdown[st]++;
      } else {
        breakdown.NEW++;
      }

      const page = r.sourcePage || '/start-project';
      const existing = sourcePageCounts.get(page) || { count: 0, wonCount: 0 };
      existing.count++;
      if (st === 'WON') {
        existing.wonCount++;
      }
      sourcePageCounts.set(page, existing);
    }

    const totalLeads = records.length;
    const wonLeads = breakdown.WON;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const topSourcePages = Array.from(sourcePageCounts.entries())
      .map(([page, { count, wonCount }]) => ({ page, count, wonCount }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLeads,
      statusBreakdown: breakdown,
      conversionRate,
      topSourcePages,
    };
  } catch (error) {
    console.error('[Get Leads Analytics Error]:', error);
    return defaultAnalytics;
  }
}
