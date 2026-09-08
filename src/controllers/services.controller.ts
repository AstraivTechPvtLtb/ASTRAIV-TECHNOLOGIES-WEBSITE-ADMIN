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

function safeRevalidateServices() {
  try {
    revalidatePath('/services');
    revalidatePath('/dashboard');
    revalidatePath('/');
  } catch {
    // Suppress error if called outside of a Next.js Server Action request context
  }
}

/**
 * Retrieves all services ordered by display order.
 */
export async function getServices(): Promise<{ data: AdminService[]; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      const records = await db.serviceItem.findMany({
        orderBy: { orderIndex: 'asc' },
      });

      const mapped: AdminService[] = records.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        category: s.category,
        short_desc: s.shortDesc,
        full_desc: s.fullDesc,
        description: s.shortDesc,
        features: s.features,
        badge: s.badge,
        icon: s.icon,
        status: s.active ? 'active' : 'draft',
        active: s.active,
        display_order: s.orderIndex,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }));

      return { data: mapped };
    }

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('services').select('*').order('display_order', { ascending: true });

    if (error) throw error;
    
    const mapped: AdminService[] = (data || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      category: s.category || 'Engineering',
      short_desc: s.short_desc || s.description || '',
      full_desc: s.full_desc || s.description || '',
      description: s.short_desc || s.description || '',
      features: s.features || [],
      badge: s.badge || null,
      icon: s.icon || 'Cpu',
      status: s.status || (s.active ? 'active' : 'draft'),
      active: s.status === 'active' || s.active === true,
      display_order: s.display_order ?? s.order_index ?? 0,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    return { data: mapped };
  } catch (error) {
    console.error('[Get Services Controller Error]:', error);
    return { data: [], error: 'Failed to fetch services' };
  }
}

/**
 * Creates a new service offering.
 */
export async function createService(data: AdminServiceInput): Promise<AdminActionResponse<AdminService>> {
  try {
    const briefDesc = data.short_desc || data.description || '';
    const largeDesc = data.full_desc || briefDesc;
    const isActive = data.status === 'active';
    const displayOrder = data.display_order ?? 0;
    const cleanSlug = (data.slug || data.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!isSupabaseConfigured()) {
      const created = await db.serviceItem.create({
        data: {
          title: data.title.trim(),
          slug: cleanSlug,
          category: data.category?.trim() || 'Engineering',
          shortDesc: briefDesc.trim(),
          fullDesc: largeDesc.trim(),
          features: data.features || [],
          badge: data.badge?.trim() || null,
          icon: data.icon?.trim() || 'Cpu',
          active: isActive,
          orderIndex: displayOrder,
        },
      });

      safeRevalidateServices();

      return {
        success: true,
        data: {
          id: created.id,
          title: created.title,
          slug: created.slug,
          category: created.category,
          short_desc: created.shortDesc,
          full_desc: created.fullDesc,
          description: created.shortDesc,
          features: created.features,
          badge: created.badge,
          icon: created.icon,
          status: created.active ? 'active' : 'draft',
          active: created.active,
          display_order: created.orderIndex,
        },
      };
    }

    const supabase = await createSupabaseClient();
    const { data: created, error } = await supabase
      .from('services')
      .insert({
        title: data.title.trim(),
        slug: cleanSlug,
        category: data.category?.trim() || 'Engineering',
        short_desc: briefDesc.trim(),
        full_desc: largeDesc.trim(),
        description: briefDesc.trim(),
        features: data.features || [],
        badge: data.badge?.trim() || null,
        icon: data.icon?.trim() || 'Cpu',
        status: data.status,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) throw error;
    safeRevalidateServices();
    return {
      success: true,
      data: {
        id: created.id,
        title: created.title,
        slug: created.slug,
        category: created.category,
        short_desc: created.short_desc || created.description,
        full_desc: created.full_desc || created.description,
        description: created.short_desc || created.description,
        features: created.features,
        badge: created.badge,
        icon: created.icon,
        status: created.status,
        active: created.status === 'active',
        display_order: created.display_order,
      },
    };
  } catch (error: any) {
    console.error('[Create Service Error]:', error);
    return { success: false, error: error?.message || 'Failed to create service' };
  }
}

/**
 * Updates an existing service catalog record.
 */
export async function updateService(
  id: string,
  data: Partial<AdminServiceInput>
): Promise<AdminActionResponse> {
  try {
    const briefDesc = data.short_desc !== undefined ? data.short_desc : data.description;
    const largeDesc = data.full_desc;

    if (!isSupabaseConfigured()) {
      const updateData: Prisma.ServiceItemUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.slug !== undefined) {
        updateData.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      if (data.category !== undefined) updateData.category = data.category.trim();
      if (briefDesc !== undefined) updateData.shortDesc = briefDesc.trim();
      if (largeDesc !== undefined) updateData.fullDesc = largeDesc.trim();
      if (data.features !== undefined) updateData.features = data.features;
      if (data.badge !== undefined) updateData.badge = data.badge?.trim() || null;
      if (data.icon !== undefined) updateData.icon = data.icon.trim();
      if (data.status !== undefined) updateData.active = data.status === 'active';
      if (data.display_order !== undefined) updateData.orderIndex = data.display_order;

      await db.serviceItem.update({
        where: { id },
        data: updateData,
      });

      safeRevalidateServices();
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.slug !== undefined) updatePayload.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    if (data.category !== undefined) updatePayload.category = data.category.trim();
    if (briefDesc !== undefined) {
      updatePayload.short_desc = briefDesc.trim();
      updatePayload.description = briefDesc.trim();
    }
    if (largeDesc !== undefined) updatePayload.full_desc = largeDesc.trim();
    if (data.features !== undefined) updatePayload.features = data.features;
    if (data.badge !== undefined) updatePayload.badge = data.badge?.trim() || null;
    if (data.icon !== undefined) updatePayload.icon = data.icon.trim();
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.display_order !== undefined) updatePayload.display_order = data.display_order;

    const { error } = await supabase.from('services').update(updatePayload).eq('id', id);

    if (error) throw error;
    safeRevalidateServices();
    return { success: true };
  } catch (error: any) {
    console.error('[Update Service Error]:', error);
    return { success: false, error: error?.message || 'Failed to update service' };
  }
}

/**
 * Quick toggle for service active/inactive status.
 */
export async function toggleServiceStatus(id: string, active: boolean): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.serviceItem.update({
        where: { id },
        data: { active },
      });
      safeRevalidateServices();
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('services')
      .update({
        status: active ? 'active' : 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    safeRevalidateServices();
    return { success: true };
  } catch (error: any) {
    console.error('[Toggle Service Status Error]:', error);
    return { success: false, error: error?.message || 'Failed to toggle service status' };
  }
}

/**
 * Swaps or updates display order between services.
 */
export async function swapServiceOrder(
  id1: string,
  order1: number,
  id2: string,
  order2: number
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.$transaction([
        db.serviceItem.update({
          where: { id: id1 },
          data: { orderIndex: order2 },
        }),
        db.serviceItem.update({
          where: { id: id2 },
          data: { orderIndex: order1 },
        }),
      ]);

      safeRevalidateServices();
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    await supabase.from('services').update({ display_order: order2 }).eq('id', id1);
    await supabase.from('services').update({ display_order: order1 }).eq('id', id2);

    safeRevalidateServices();
    return { success: true };
  } catch (error: any) {
    console.error('[Swap Service Order Error]:', error);
    return { success: false, error: error?.message || 'Failed to update order' };
  }
}

/**
 * Updates a single service's display order.
 */
export async function updateServiceOrder(
  id: string,
  newOrder: number
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.serviceItem.update({
        where: { id },
        data: { orderIndex: newOrder },
      });
      safeRevalidateServices();
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('services')
      .update({ display_order: newOrder })
      .eq('id', id);

    if (error) throw error;
    safeRevalidateServices();
    return { success: true };
  } catch (error: any) {
    console.error('[Update Service Order Error]:', error);
    return { success: false, error: error?.message || 'Failed to update order' };
  }
}

/**
 * Deletes a service catalog record.
 */
export async function deleteService(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.serviceItem.delete({
        where: { id },
      });
      safeRevalidateServices();
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) throw error;
    safeRevalidateServices();
    return { success: true };
  } catch (error: any) {
    console.error('[Delete Service Error]:', error);
    return { success: false, error: error?.message || 'Failed to delete service' };
  }
}


