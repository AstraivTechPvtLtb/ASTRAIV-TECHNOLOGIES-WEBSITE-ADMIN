'use server';

/**
 * @file admin/src/controllers/recruitment.controller.ts
 * @description [CONTROLLER] Business logic for managing career openings and talent recruitment.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminJobOpening, AdminJobOpeningInput, AdminActionResponse } from '@/models/types';
import { Prisma } from '@prisma/client';
import { requireAdminUser } from './auth.controller';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Intentionally ignored when invoked outside active Next.js request context
  }
}

/**
 * Retrieves all job openings ordered by orderIndex.
 */
export async function getJobOpenings(): Promise<{ data: AdminJobOpening[]; error?: string }> {
  // 1. Primary: Direct PostgreSQL via Prisma ORM
  try {
    const records = await db.jobOpening.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    if (records && records.length > 0) {
      const mapped: AdminJobOpening[] = records.map((job) => ({
        id: job.id,
        title: job.title,
        slug: job.slug,
        department: job.department,
        type: job.type,
        location: job.location,
        experience: job.experience,
        description: job.description,
        skills: job.skills,
        salary: job.salary,
        applyUrl: job.applyUrl,
        active: job.active,
        orderIndex: job.orderIndex,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      }));

      return { data: mapped };
    }
  } catch (prismaErr) {
    console.warn('[Admin Recruitment Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
  }

  // 2. Secondary: Supabase client fallback
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseClient();
      const { data, error } = await supabase
        .from('job_openings')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        interface SupabaseJobRow {
          id: string;
          title: string;
          slug: string;
          department?: string;
          type?: string;
          location?: string;
          experience?: string | null;
          description: string;
          skills?: string[];
          salary?: string | null;
          apply_url?: string | null;
          active?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        }

        const mapped: AdminJobOpening[] = ((data as unknown as SupabaseJobRow[]) || []).map((j) => ({
          id: j.id,
          title: j.title,
          slug: j.slug,
          department: j.department || 'Engineering',
          type: j.type || 'Full-Time / Remote',
          location: j.location || 'Remote',
          experience: j.experience || null,
          description: j.description || '',
          skills: j.skills || [],
          salary: j.salary || null,
          applyUrl: j.apply_url || '/contact',
          active: j.active !== false,
          orderIndex: j.order_index ?? 0,
          createdAt: j.created_at || new Date().toISOString(),
          updatedAt: j.updated_at || new Date().toISOString(),
        }));

        return { data: mapped };
      }
      if (error) {
        console.warn('[Admin Supabase Recruitment Notice]:', error.message);
      }
    } catch (supaErr) {
      console.warn('[Admin Supabase Recruitment Error]:', (supaErr as Error)?.message || supaErr);
    }
  }

  return { data: [] };
}

/**
 * Creates a new job opening.
 */
export async function createJobOpening(
  data: AdminJobOpeningInput
): Promise<AdminActionResponse<AdminJobOpening>> {
  try {
    await requireAdminUser();
    const rawSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = rawSlug || `job-${Date.now()}`;
    try {
      const existing = await db.jobOpening.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    } catch {}
    const orderIndex = data.orderIndex ?? 0;
    const department = data.department || 'Engineering';
    const type = data.type || 'Full-Time / Remote';
    const location = data.location || 'Remote';
    const description = data.description || '';
    const skills = data.skills || [];
    const active = data.active !== false;
    const applyUrl = data.applyUrl || '/contact';

    let createdOpening: AdminJobOpening | null = null;

    // 1. Write via Prisma
    try {
      const created = await db.jobOpening.create({
        data: {
          title: data.title,
          slug,
          department,
          type,
          location,
          experience: data.experience || null,
          description,
          skills,
          salary: data.salary || null,
          applyUrl,
          active,
          orderIndex,
        },
      });

      createdOpening = {
        id: created.id,
        title: created.title,
        slug: created.slug,
        department: created.department,
        type: created.type,
        location: created.location,
        experience: created.experience,
        description: created.description,
        skills: created.skills,
        salary: created.salary,
        applyUrl: created.applyUrl,
        active: created.active,
        orderIndex: created.orderIndex,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (prismaErr) {
      console.warn('[Admin Create JobOpening Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Also write to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const payload: Record<string, unknown> = {
          title: data.title,
          slug,
          department,
          type,
          location,
          experience: data.experience || null,
          description,
          skills,
          salary: data.salary || null,
          apply_url: applyUrl,
          active,
          order_index: orderIndex,
        };
        if (createdOpening?.id) {
          payload.id = createdOpening.id;
        }

        const { data: supaCreated, error } = await supabase
          .from('job_openings')
          .upsert(payload)
          .select()
          .single();

        if (!error && supaCreated && !createdOpening) {
          createdOpening = {
            id: supaCreated.id,
            title: supaCreated.title,
            slug: supaCreated.slug,
            department: supaCreated.department,
            type: supaCreated.type,
            location: supaCreated.location,
            experience: supaCreated.experience,
            description: supaCreated.description,
            skills: supaCreated.skills || [],
            salary: supaCreated.salary,
            applyUrl: supaCreated.apply_url,
            active: supaCreated.active,
            orderIndex: supaCreated.order_index,
            createdAt: supaCreated.created_at,
            updatedAt: supaCreated.updated_at,
          };
        }
      } catch (supaErr) {
        console.warn('[Admin Create JobOpening Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/recruitment');
    safeRevalidate('/dashboard');

    if (createdOpening) {
      return { success: true, data: createdOpening };
    }

    return { success: false, error: 'Failed to create job opening in database' };
  } catch (error) {
    console.error('[Create JobOpening Error]:', error);
    return { success: false, error: 'Failed to create job opening' };
  }
}

/**
 * Updates an existing job opening.
 */
export async function updateJobOpening(
  id: string,
  data: Partial<AdminJobOpeningInput>
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    let updated = false;

    // 1. Update via Prisma
    try {
      const updateData: Prisma.JobOpeningUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.department !== undefined) updateData.department = data.department;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.experience !== undefined) updateData.experience = data.experience;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.skills !== undefined) updateData.skills = data.skills;
      if (data.salary !== undefined) updateData.salary = data.salary;
      if (data.applyUrl !== undefined) updateData.applyUrl = data.applyUrl;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

      await db.jobOpening.update({
        where: { id },
        data: updateData,
      });
      updated = true;
    } catch (prismaErr) {
      console.warn('[Admin Update JobOpening Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Also update via Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const payload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (data.title !== undefined) payload.title = data.title;
        if (data.slug !== undefined) payload.slug = data.slug;
        if (data.department !== undefined) payload.department = data.department;
        if (data.type !== undefined) payload.type = data.type;
        if (data.location !== undefined) payload.location = data.location;
        if (data.experience !== undefined) payload.experience = data.experience;
        if (data.description !== undefined) payload.description = data.description;
        if (data.skills !== undefined) payload.skills = data.skills;
        if (data.salary !== undefined) payload.salary = data.salary;
        if (data.applyUrl !== undefined) payload.apply_url = data.applyUrl;
        if (data.active !== undefined) payload.active = data.active;
        if (data.orderIndex !== undefined) payload.order_index = data.orderIndex;

        const { error } = await supabase.from('job_openings').update(payload).eq('id', id);
        if (!error) updated = true;
      } catch (supaErr) {
        console.warn('[Admin Update JobOpening Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/recruitment');
    safeRevalidate('/dashboard');

    if (updated) {
      return { success: true, message: 'Job opening updated successfully' };
    }

    return { success: false, error: 'Could not update job opening in database' };
  } catch (error) {
    console.error('[Update JobOpening Error]:', error);
    return { success: false, error: 'Failed to update job opening' };
  }
}

/**
 * Removes / deletes a job opening.
 */
export async function deleteJobOpening(id: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    let deleted = false;

    // 1. Prisma delete
    try {
      await db.jobOpening.delete({ where: { id } });
      deleted = true;
    } catch (prismaErr) {
      console.warn('[Admin Delete JobOpening Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Supabase delete
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const { error } = await supabase.from('job_openings').delete().eq('id', id);
        if (!error) deleted = true;
      } catch (supaErr) {
        console.warn('[Admin Delete JobOpening Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/recruitment');
    safeRevalidate('/dashboard');

    if (deleted) {
      return { success: true, message: 'Job opening removed successfully' };
    }

    return { success: false, error: 'Failed to delete job opening' };
  } catch (error) {
    console.error('[Delete JobOpening Error]:', error);
    return { success: false, error: 'Failed to delete job opening' };
  }
}

/**
 * Reorders a job opening up or down.
 */
export async function reorderJobOpening(
  id: string,
  direction: 'up' | 'down'
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const openings = await db.jobOpening.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const currentIndex = openings.findIndex((j) => j.id === id);
    if (currentIndex === -1) {
      return { success: false, error: 'Job opening not found' };
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= openings.length) {
      return { success: true, message: 'Already at extreme position' };
    }

    const currentOpening = openings[currentIndex];
    const targetOpening = openings[targetIndex];

    const currentOrder = currentOpening.orderIndex;
    const targetOrder = targetOpening.orderIndex;

    const newCurrentOrder = currentOrder === targetOrder ? (direction === 'up' ? targetOrder - 1 : targetOrder + 1) : targetOrder;
    const newTargetOrder = currentOrder;

    await db.$transaction([
      db.jobOpening.update({
        where: { id: currentOpening.id },
        data: { orderIndex: newCurrentOrder },
      }),
      db.jobOpening.update({
        where: { id: targetOpening.id },
        data: { orderIndex: newTargetOrder },
      }),
    ]);

    safeRevalidate('/recruitment');
    return { success: true, message: 'Order updated successfully' };
  } catch (error) {
    console.error('[Reorder JobOpening Error]:', error);
    return { success: false, error: 'Failed to reorder job opening' };
  }
}

/**
 * Toggles active/draft visibility of a job opening.
 */
export async function toggleJobOpeningStatus(
  id: string,
  active: boolean
): Promise<AdminActionResponse> {
  return updateJobOpening(id, { active });
}
