'use server';

/**
 * @file admin/src/controllers/services.controller.ts
 * @description [CONTROLLER] Business logic for managing the service catalog and offerings.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminService, AdminServiceInput, AdminActionResponse } from '@/models/types';
import { Prisma } from '@prisma/client';

/**
 * Retrieves all services ordered by display order.
 * Dual-engine resilience: Tries direct PostgreSQL via Prisma ORM first.
 * If Prisma returns empty or is unavailable and Supabase is configured, falls back to Supabase client.
 */
export async function getServices(): Promise<{ data: AdminService[]; error?: string }> {
  // 1. Primary: Direct PostgreSQL via Prisma ORM
  try {
    const records = await db.serviceItem.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    if (records && records.length > 0) {
      const mapped: AdminService[] = records.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        category: s.category || 'Engineering',
        badge: s.badge || null,
        icon: s.icon || 'Cpu',
        shortDesc: s.shortDesc || '',
        fullDesc: s.fullDesc || s.shortDesc || '',
        features: s.features || [],
        status: s.active ? 'active' : 'draft',
        display_order: s.orderIndex,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }));

      return { data: mapped };
    }
  } catch (prismaErr) {
    console.warn('[Admin Prisma Services Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
  }

  // 2. Secondary: Supabase client fallback
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseClient();
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        interface SupabaseServiceRow {
          id: string;
          title: string;
          slug: string;
          category?: string | null;
          badge?: string | null;
          icon?: string;
          short_desc?: string | null;
          full_desc?: string | null;
          description?: string | null;
          features?: string[] | null;
          active?: boolean;
          status?: string;
          order_index?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        }

        const mapped: AdminService[] = ((data as unknown as SupabaseServiceRow[]) || []).map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          category: s.category || 'Engineering',
          badge: s.badge || null,
          icon: s.icon || 'Cpu',
          shortDesc: s.short_desc || s.description || '',
          fullDesc: s.full_desc || s.short_desc || s.description || '',
          features: s.features || [],
          status: s.active ? 'active' : 'draft',
          display_order: s.order_index ?? s.display_order ?? 0,
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        }));

        return { data: mapped };
      }
      if (error) {
        console.warn('[Admin Supabase Services Notice]:', error.message);
      }
    } catch (supaErr) {
      console.warn('[Admin Supabase Services Error]:', (supaErr as Error)?.message || supaErr);
    }
  }

  return { data: [] };
}

/**
 * Creates a new service offering with all rich fields.
 */
export async function createService(data: AdminServiceInput): Promise<AdminActionResponse<AdminService>> {
  try {
    const orderIndex = data.display_order ?? 0;
    const shortDesc = data.shortDesc || '';
    const fullDesc = data.fullDesc || shortDesc;
    const category = data.category || 'Engineering';
    const badge = data.badge || null;
    const icon = data.icon || 'Cpu';
    const features = data.features || [];
    const active = data.status === 'active';

    let createdService: AdminService | null = null;

    // 1. Write via Prisma
    try {
      const created = await db.serviceItem.create({
        data: {
          title: data.title,
          slug: data.slug,
          category,
          badge,
          icon,
          shortDesc,
          fullDesc,
          features,
          active,
          orderIndex,
        },
      });

      createdService = {
        id: created.id,
        title: created.title,
        slug: created.slug,
        category: created.category,
        badge: created.badge,
        icon: created.icon,
        shortDesc: created.shortDesc,
        fullDesc: created.fullDesc,
        features: created.features,
        status: created.active ? 'active' : 'draft',
        display_order: created.orderIndex,
        created_at: created.createdAt.toISOString(),
        updated_at: created.updatedAt.toISOString(),
      };
    } catch (prismaErr) {
      console.warn('[Admin Create Service Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Also write to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const insertPayload: Record<string, unknown> = {
          title: data.title,
          slug: data.slug,
          category,
          badge,
          icon,
          short_desc: shortDesc,
          full_desc: fullDesc,
          features,
          active,
          order_index: orderIndex,
        };
        if (createdService?.id) {
          insertPayload.id = createdService.id;
        }

        const { data: supaCreated, error } = await supabase
          .from('services')
          .upsert(insertPayload)
          .select()
          .single();

        if (!error && supaCreated && !createdService) {
          createdService = {
            id: supaCreated.id,
            title: supaCreated.title,
            slug: supaCreated.slug,
            category: supaCreated.category,
            badge: supaCreated.badge,
            icon: supaCreated.icon,
            shortDesc: supaCreated.short_desc,
            fullDesc: supaCreated.full_desc,
            features: supaCreated.features || [],
            status: supaCreated.active ? 'active' : 'draft',
            display_order: supaCreated.order_index,
          };
        }
      } catch (supaErr) {
        console.warn('[Admin Create Service Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    revalidatePath('/services');
    revalidatePath('/dashboard');

    if (createdService) {
      return { success: true, data: createdService };
    }

    return { success: false, error: 'Failed to create service in database' };
  } catch (error) {
    console.error('[Create Service Error]:', error);
    return { success: false, error: 'Failed to create service' };
  }
}

/**
 * Updates an existing service catalog record preserving full descriptions.
 */
export async function updateService(
  id: string,
  data: Partial<AdminServiceInput>
): Promise<AdminActionResponse> {
  try {
    let updated = false;

    // 1. Update via Prisma
    try {
      const updateData: Prisma.ServiceItemUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.badge !== undefined) updateData.badge = data.badge;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc;
      if (data.fullDesc !== undefined) updateData.fullDesc = data.fullDesc;
      if (data.features !== undefined) updateData.features = data.features;
      if (data.status !== undefined) updateData.active = data.status === 'active';
      if (data.display_order !== undefined) updateData.orderIndex = data.display_order;

      await db.serviceItem.update({
        where: { id },
        data: updateData,
      });
      updated = true;
    } catch (prismaErr) {
      console.warn('[Admin Update Service Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Update via Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.slug !== undefined) updatePayload.slug = data.slug;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.badge !== undefined) updatePayload.badge = data.badge;
        if (data.icon !== undefined) updatePayload.icon = data.icon;
        if (data.shortDesc !== undefined) updatePayload.short_desc = data.shortDesc;
        if (data.fullDesc !== undefined) updatePayload.full_desc = data.fullDesc;
        if (data.features !== undefined) updatePayload.features = data.features;
        if (data.status !== undefined) updatePayload.active = data.status === 'active';
        if (data.display_order !== undefined) updatePayload.order_index = data.display_order;

        const { error } = await supabase
          .from('services')
          .update(updatePayload)
          .eq('id', id);

        if (!error) updated = true;
      } catch (supaErr) {
        console.warn('[Admin Update Service Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    revalidatePath('/services');
    revalidatePath('/dashboard');

    return { success: updated };
  } catch (error) {
    console.error('[Update Service Error]:', error);
    return { success: false, error: 'Failed to update service' };
  }
}

/**
 * Toggles a service's public active visibility (visible or hidden).
 */
export async function toggleServiceVisibility(
  id: string,
  newStatus: 'active' | 'draft'
): Promise<AdminActionResponse> {
  try {
    const active = newStatus === 'active';
    let updated = false;

    // 1. Update via Prisma
    try {
      await db.serviceItem.update({
        where: { id },
        data: { active },
      });
      updated = true;
    } catch (prismaErr) {
      console.warn('[Admin Toggle Service Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Update via Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const { error } = await supabase
          .from('services')
          .update({
            active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (!error) updated = true;
      } catch (supaErr) {
        console.warn('[Admin Toggle Service Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    revalidatePath('/services');
    revalidatePath('/dashboard');
    return { success: updated };
  } catch (error) {
    console.error('[Toggle Service Visibility Error]:', error);
    return { success: false, error: 'Failed to update visibility status' };
  }
}

/**
 * Reorders a service offering relative to adjacent records.
 */
export async function reorderService(
  id: string,
  direction: 'up' | 'down'
): Promise<AdminActionResponse> {
  try {
    const records = await db.serviceItem.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const currentIndex = records.findIndex((s) => s.id === id);
    if (currentIndex === -1) return { success: false, error: 'Service not found' };

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= records.length) {
      return { success: true }; // Already at edge
    }

    const currentItem = records[currentIndex];
    const targetItem = records[targetIndex];

    await db.$transaction([
      db.serviceItem.update({
        where: { id: currentItem.id },
        data: { orderIndex: targetItem.orderIndex },
      }),
      db.serviceItem.update({
        where: { id: targetItem.id },
        data: { orderIndex: currentItem.orderIndex },
      }),
    ]);

    // Also sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        await Promise.all([
          supabase.from('services').update({ order_index: targetItem.orderIndex }).eq('id', currentItem.id),
          supabase.from('services').update({ order_index: currentItem.orderIndex }).eq('id', targetItem.id),
        ]);
      } catch (supaErr) {
        console.warn('[Admin Reorder Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    revalidatePath('/services');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Reorder Service Error]:', error);
    return { success: false, error: 'Failed to reorder service' };
  }
}

/**
 * Deletes a service catalog record.
 */
export async function deleteService(id: string): Promise<AdminActionResponse> {
  try {
    let deleted = false;

    // 1. Delete via Prisma
    try {
      await db.serviceItem.delete({
        where: { id },
      });
      deleted = true;
    } catch (prismaErr) {
      console.warn('[Admin Delete Service Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Delete via Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (!error) deleted = true;
      } catch (supaErr) {
        console.warn('[Admin Delete Service Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    revalidatePath('/services');
    revalidatePath('/dashboard');
    return { success: deleted };
  } catch (error) {
    console.error('[Delete Service Error]:', error);
    return { success: false, error: 'Failed to delete service' };
  }
}
