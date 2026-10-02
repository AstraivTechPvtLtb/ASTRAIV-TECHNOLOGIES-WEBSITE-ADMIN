'use server';

/**
 * @file admin/src/controllers/solutions.controller.ts
 * @description [CONTROLLER] Solutions CMS Controller (What business problems Astraiv solves).
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface AdminSolution {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryLabel?: string | null;
  tagline?: string | null;
  shortDesc: string;
  fullDesc?: string | null;
  metricValue?: string | null;
  metricLabel?: string | null;
  features: string[];
  technologies: string[];
  active: boolean;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  orderIndex: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSolutions(): Promise<{ success: boolean; data: AdminSolution[]; error?: string }> {
  try {
    const rows = await db.solutionItem.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return {
      success: true,
      data: rows.map(r => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        category: r.category,
        categoryLabel: r.categoryLabel,
        tagline: r.tagline,
        shortDesc: r.shortDesc,
        fullDesc: r.fullDesc,
        metricValue: r.metricValue,
        metricLabel: r.metricLabel,
        features: r.features || [],
        technologies: r.technologies || [],
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
    console.error('[getSolutions error]:', err);
    return { success: false, data: [], error: (err as Error)?.message || 'Failed to fetch solutions.' };
  }
}

export async function createSolution(data: {
  title: string;
  slug: string;
  category: string;
  categoryLabel?: string;
  tagline?: string;
  shortDesc: string;
  fullDesc?: string;
  metricValue?: string;
  metricLabel?: string;
  features: string[];
  technologies: string[];
  active?: boolean;
  status?: 'published' | 'draft' | 'archived';
  featured?: boolean;
  orderIndex?: number;
  metaTitle?: string;
  metaDescription?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.solutionItem.create({
      data: {
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        category: data.category.trim(),
        categoryLabel: data.categoryLabel?.trim() || null,
        tagline: data.tagline?.trim() || null,
        shortDesc: data.shortDesc.trim(),
        fullDesc: data.fullDesc?.trim() || null,
        metricValue: data.metricValue?.trim() || null,
        metricLabel: data.metricLabel?.trim() || null,
        features: data.features || [],
        technologies: data.technologies || [],
        active: data.active ?? true,
        status: data.status || 'published',
        featured: data.featured ?? false,
        orderIndex: data.orderIndex ?? 0,
        metaTitle: data.metaTitle?.trim() || null,
        metaDescription: data.metaDescription?.trim() || null
      }
    });

    await logAuditAction({ action: 'CREATE_SOLUTION', entityType: 'solution', entityId: data.slug });
    revalidatePath('/solutions');
    return { success: true };
  } catch (err: unknown) {
    console.error('[createSolution error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to create solution.' };
  }
}

export async function updateSolution(id: string, data: Partial<AdminSolution>): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.solutionItem.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.slug ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(data.category ? { category: data.category.trim() } : {}),
        ...(data.categoryLabel !== undefined ? { categoryLabel: data.categoryLabel } : {}),
        ...(data.tagline !== undefined ? { tagline: data.tagline } : {}),
        ...(data.shortDesc ? { shortDesc: data.shortDesc.trim() } : {}),
        ...(data.fullDesc !== undefined ? { fullDesc: data.fullDesc } : {}),
        ...(data.metricValue !== undefined ? { metricValue: data.metricValue } : {}),
        ...(data.metricLabel !== undefined ? { metricLabel: data.metricLabel } : {}),
        ...(data.features !== undefined ? { features: data.features } : {}),
        ...(data.technologies !== undefined ? { technologies: data.technologies } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle } : {}),
        ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription } : {}),
        updatedAt: new Date()
      }
    });

    await logAuditAction({ action: 'UPDATE_SOLUTION', entityType: 'solution', entityId: id });
    revalidatePath('/solutions');
    return { success: true };
  } catch (err: unknown) {
    console.error('[updateSolution error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update solution.' };
  }
}

export async function deleteSolution(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.solutionItem.delete({ where: { id } });
    await logAuditAction({ action: 'DELETE_SOLUTION', entityType: 'solution', entityId: id });
    revalidatePath('/solutions');
    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteSolution error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete solution.' };
  }
}
