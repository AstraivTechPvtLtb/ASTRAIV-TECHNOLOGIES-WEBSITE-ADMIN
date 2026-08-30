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
        description: s.shortDesc,
        icon: s.icon,
        status: s.active ? 'active' : 'draft',
        display_order: s.orderIndex,
        created_at: s.createdAt.toISOString(),
        updated_at: s.updatedAt.toISOString(),
      }));

      return { data: mapped };
    }

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('services').select('*').order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data as AdminService[]) || [] };
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
    if (!isSupabaseConfigured()) {
      const created = await db.serviceItem.create({
        data: {
          title: data.title,
          slug: data.slug,
          shortDesc: data.description,
          fullDesc: data.description,
          icon: data.icon || 'Code2',
          active: data.status === 'active',
          orderIndex: data.display_order ?? 0,
          features: [],
        },
      });

      revalidatePath('/services');
      revalidatePath('/dashboard');

      return {
        success: true,
        data: {
          id: created.id,
          title: created.title,
          slug: created.slug,
          description: created.shortDesc,
          icon: created.icon,
          status: created.active ? 'active' : 'draft',
          display_order: created.orderIndex,
        },
      };
    }

    const supabase = await createSupabaseClient();
    const { data: created, error } = await supabase
      .from('services')
      .insert({
        title: data.title,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        status: data.status,
        display_order: data.display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/services');
    revalidatePath('/dashboard');
    return { success: true, data: created as AdminService };
  } catch (error) {
    console.error('[Create Service Error]:', error);
    return { success: false, error: 'Failed to create service' };
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
    if (!isSupabaseConfigured()) {
      const updateData: Prisma.ServiceItemUpdateInput = {};
      if (data.title) updateData.title = data.title;
      if (data.slug) updateData.slug = data.slug;
      if (data.description) {
        updateData.shortDesc = data.description;
        updateData.fullDesc = data.description;
      }
      if (data.icon) updateData.icon = data.icon;
      if (data.status) updateData.active = data.status === 'active';
      if (data.display_order !== undefined) updateData.orderIndex = data.display_order;

      await db.serviceItem.update({
        where: { id },
        data: updateData,
      });

      revalidatePath('/services');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('services')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/services');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Update Service Error]:', error);
    return { success: false, error: 'Failed to update service' };
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
      revalidatePath('/services');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) throw error;
    revalidatePath('/services');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Service Error]:', error);
    return { success: false, error: 'Failed to delete service' };
  }
}
