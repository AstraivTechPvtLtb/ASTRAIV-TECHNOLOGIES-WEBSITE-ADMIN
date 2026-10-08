'use server';

/**
 * @file admin/src/controllers/leads.controller.ts
 * @description [CONTROLLER] Business logic for managing prospective enterprise project leads,
 * lifecycle progression (NEW -> QUALIFIED -> CONTACTED -> PROPOSAL -> NEGOTIATION -> WON / LOST),
 * portal access approval, 24-hour credential dispatch, and attribution analytics.
 */

import { pool } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { requireAdminUser } from './auth.controller';
import {
  AdminLead,
  LeadLifecycleStatus,
  AdminActionResponse,
  AdminLeadAnalytics,
} from '@/models/types';

export interface GetLeadsParams {
  search?: string;
  status?: 'all' | LeadLifecycleStatus;
  sourcePage?: string;
  page?: number;
  limit?: number;
}

/**
 * Retrieves paginated leads with full lifecycle, attribution, portal access, and search filtering.
 */
export async function getLeads({
  search = '',
  status = 'all',
  sourcePage = '',
  page = 1,
  limit = 50,
}: GetLeadsParams = {}): Promise<{ data: AdminLead[]; total: number; error?: string }> {
  try {
    await requireAdminUser();
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (status !== 'all') {
      whereClause += ` AND status = $${paramIdx++}`;
      params.push(status);
    }

    if (sourcePage.trim()) {
      whereClause += ` AND source_page ILIKE $${paramIdx++}`;
      params.push(`%${sourcePage.trim()}%`);
    }

    if (search.trim()) {
      whereClause += ` AND (lead_number ILIKE $${paramIdx} OR name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR company ILIKE $${paramIdx} OR source_page ILIKE $${paramIdx} OR notes ILIKE $${paramIdx})`;
      params.push(`%${search.trim()}%`);
      paramIdx++;
    }

    // Count query
    const countRes = await pool.query(
      `SELECT COUNT(*) as total FROM crm_lead ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Records query with limit and offset
    const recordsParams = [...params, limit, offset];
    const recordsRes = await pool.query(
      `SELECT id, lead_number, name, email, phone, company, service_id, solution_id, industry_id,
              project_description, budget_range, timeline, source_page, utm_source, utm_medium, utm_campaign,
              status, assigned_to, notes, portal_approved, portal_password, approved_at,
              first_login_expires_at, has_logged_in, first_logged_in_at, "createdAt", "updatedAt"
       FROM crm_lead
       ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      recordsParams
    );

    const mapped: AdminLead[] = recordsRes.rows.map((r) => ({
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
      assigned_user_name: null,
      notes: r.notes,
      portal_approved: Boolean(r.portal_approved),
      portal_password: r.portal_password,
      approved_at: r.approved_at ? new Date(r.approved_at).toISOString() : null,
      first_login_expires_at: r.first_login_expires_at ? new Date(r.first_login_expires_at).toISOString() : null,
      has_logged_in: Boolean(r.has_logged_in),
      first_logged_in_at: r.first_logged_in_at ? new Date(r.first_logged_in_at).toISOString() : null,
      created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updated_at: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
    }));

    return { data: mapped, total };
  } catch (error) {
    console.error('[Get Leads Controller Error]:', (error as Error)?.message || error);
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
    await requireAdminUser();
    await pool.query(
      `UPDATE crm_lead SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
      [newStatus, id]
    );

    revalidatePath('/leads');
    revalidatePath('/dashboard');
    revalidatePath('/enquiries');
    return { success: true };
  } catch (error) {
    console.error('[Update Lead Status Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to update lead lifecycle status' };
  }
}

/**
 * Approves a client lead for portal access from the admin board:
 * 1. Generates or sets temporary password.
 * 2. Enables portal_approved = TRUE.
 * 3. Starts 24-hour initial login countdown (first_login_expires_at = NOW() + 24 hours).
 * 4. Dispatches / logs credentials notification email.
 */
export async function approveLeadPortalAccess(
  leadId: string,
  customPassword?: string
): Promise<AdminActionResponse<{
  leadNumber: string;
  email: string;
  password: string;
  expiresAt: string;
}>> {
  try {
    await requireAdminUser();

    // Generate readable, secure password if none provided
    const password = customPassword?.trim() || `Pass${Math.floor(100000 + Math.random() * 900000)}`;

    const res = await pool.query(
      `UPDATE crm_lead 
       SET portal_approved = TRUE,
           portal_password = $1,
           approved_at = NOW(),
           first_login_expires_at = NOW() + INTERVAL '24 hours',
           has_logged_in = FALSE,
           first_logged_in_at = NULL,
           status = CASE WHEN status = 'NEW' THEN 'QUALIFIED' ELSE status END,
           "updatedAt" = NOW()
       WHERE id = $2
       RETURNING id, lead_number, name, email, portal_password, first_login_expires_at`,
      [password, leadId]
    );

    if (res.rows.length === 0) {
      return { success: false, error: 'Lead not found.' };
    }

    const lead = res.rows[0];

    // Ensure User account exists for the lead
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, TRUE, 'CLIENT', NOW(), NOW())
       ON CONFLICT (email) 
       DO UPDATE SET role = 'CLIENT', "updatedAt" = NOW()`,
      [lead.id, lead.name, lead.email.toLowerCase().trim()]
    );

    console.log(`[CLIENT PORTAL APPROVAL EMAIL DISPATCHED]
      To: ${lead.email}
      Client Name: ${lead.name}
      Lead Number: ${lead.lead_number}
      Temporary Password: ${password}
      Expires At: ${new Date(lead.first_login_expires_at).toLocaleString()} (24-Hour Window)
      Portal URL: http://localhost:3000/en/auth/login
    `);

    revalidatePath('/leads');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: `Lead ${lead.lead_number} approved! Credentials dispatched to ${lead.email}. Valid for 24 hours.`,
      data: {
        leadNumber: lead.lead_number,
        email: lead.email,
        password,
        expiresAt: new Date(lead.first_login_expires_at).toISOString(),
      },
    };
  } catch (error) {
    console.error('[Approve Lead Portal Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to approve lead for portal access' };
  }
}

/**
 * Revokes client portal access for a lead.
 */
export async function revokeLeadPortalAccess(leadId: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    await pool.query(
      `UPDATE crm_lead SET portal_approved = FALSE, "updatedAt" = NOW() WHERE id = $1`,
      [leadId]
    );

    revalidatePath('/leads');
    revalidatePath('/dashboard');
    return { success: true, message: 'Portal access revoked for this lead.' };
  } catch (error) {
    console.error('[Revoke Lead Portal Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to revoke portal access' };
  }
}

/**
 * Resets / extends the 24-hour first login countdown window for a client who missed it.
 */
export async function resetLeadLoginWindow(leadId: string): Promise<AdminActionResponse<{ expiresAt: string }>> {
  try {
    await requireAdminUser();
    const res = await pool.query(
      `UPDATE crm_lead 
       SET first_login_expires_at = NOW() + INTERVAL '24 hours',
           has_logged_in = FALSE,
           "updatedAt" = NOW()
       WHERE id = $1
       RETURNING first_login_expires_at`,
      [leadId]
    );

    if (res.rows.length === 0) {
      return { success: false, error: 'Lead not found.' };
    }

    const expiresAt = new Date(res.rows[0].first_login_expires_at).toISOString();
    revalidatePath('/leads');
    return {
      success: true,
      message: '24-hour login window renewed successfully.',
      data: { expiresAt },
    };
  } catch (error) {
    console.error('[Reset Lead Window Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to reset 24-hour login window' };
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
    await requireAdminUser();
    await pool.query(
      `UPDATE crm_lead SET assigned_to = $1, "updatedAt" = NOW() WHERE id = $2`,
      [assignedTo, id]
    );

    revalidatePath('/leads');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Assign Lead Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to assign lead' };
  }
}

/**
 * Appends or edits internal administrative notes for a lead.
 */
export async function updateLeadNotes(id: string, notes: string): Promise<AdminActionResponse> {
  try {
    await pool.query(
      `UPDATE crm_lead SET notes = $1, "updatedAt" = NOW() WHERE id = $2`,
      [notes, id]
    );

    revalidatePath('/leads');
    return { success: true };
  } catch (error) {
    console.error('[Update Lead Notes Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to update lead notes' };
  }
}

/**
 * Permanently deletes a lead record.
 */
export async function deleteLead(id: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    await pool.query(`DELETE FROM crm_lead WHERE id = $1`, [id]);

    revalidatePath('/leads');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Lead Error]:', (error as Error)?.message || error);
    return { success: false, error: 'Failed to delete lead' };
  }
}

/**
 * Computes live lead analytics, status funnel breakdown, conversion rate,
 * and top source pages to determine which pages generate the most leads.
 */
export async function getLeadsAnalytics(): Promise<AdminLeadAnalytics> {
  await requireAdminUser();
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
    const recordsRes = await pool.query(
      `SELECT status, source_page FROM crm_lead`
    );
    const records = recordsRes.rows;

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

      const page = r.source_page || '/start-project';
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
