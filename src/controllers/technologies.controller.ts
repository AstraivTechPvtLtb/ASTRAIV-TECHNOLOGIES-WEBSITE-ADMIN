'use server';

/**
 * @file admin/src/controllers/technologies.controller.ts
 * @description [CONTROLLER] Technologies & Tech Stack CMS Controller.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface AdminTechnology {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon: string;
  description?: string | null;
  active: boolean;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  orderIndex: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTechnologies(): Promise<{ success: boolean; data: AdminTechnology[]; error?: string }> {
  try {
    const rows = await db.technologyItem.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return {
      success: true,
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        category: r.category,
        icon: r.icon,
        description: r.description,
        active: r.active,
        status: (r.status as 'published' | 'draft' | 'archived') || 'published',
        featured: r.featured,
        orderIndex: r.orderIndex,
        metaTitle: r.metaTitle,
        metaDescription: r.metaDescription,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    };
  } catch (err: unknown) {
    console.error('[getTechnologies error]:', err);
    return { success: false, data: [], error: (err as Error)?.message || 'Failed to fetch technologies.' };
  }
}

export async function createTechnology(data: {
  name: string;
  slug: string;
  category: string;
  icon: string;
  description?: string;
  active?: boolean;
  status?: 'published' | 'draft' | 'archived';
  featured?: boolean;
  orderIndex?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.technologyItem.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        category: data.category.trim(),
        icon: data.icon.trim() || 'Cpu',
        description: data.description?.trim() || null,
        active: data.active ?? true,
        status: data.status || 'published',
        featured: data.featured ?? false,
        orderIndex: data.orderIndex ?? 0
      }
    });

    await logAuditAction({ action: 'CREATE_TECHNOLOGY', entityType: 'technology', entityId: data.slug });
    revalidatePath('/technologies');
    return { success: true };
  } catch (err: unknown) {
    console.error('[createTechnology error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to create technology.' };
  }
}

export async function updateTechnology(id: string, data: Partial<AdminTechnology>): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.technologyItem.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.slug ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(data.category ? { category: data.category.trim() } : {}),
        ...(data.icon ? { icon: data.icon.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        updatedAt: new Date()
      }
    });

    await logAuditAction({ action: 'UPDATE_TECHNOLOGY', entityType: 'technology', entityId: id });
    revalidatePath('/technologies');
    return { success: true };
  } catch (err: unknown) {
    console.error('[updateTechnology error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update technology.' };
  }
}

export async function deleteTechnology(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.technologyItem.delete({ where: { id } });
    await logAuditAction({ action: 'DELETE_TECHNOLOGY', entityType: 'technology', entityId: id });
    revalidatePath('/technologies');
    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteTechnology error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete technology.' };
  }
}
