'use server';

/**
 * @file admin/src/controllers/industries.controller.ts
 * @description [CONTROLLER] Industries CMS Controller (Vertical domains Astraiv serves).
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface AdminIndustry {
  id: string;
  slug: string;
  code?: string | null;
  label: string;
  tagline?: string | null;
  headline?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  accentColor?: string | null;
  statusText?: string | null;
  complianceBadge?: string | null;
  challenge?: string | null;
  solution?: string | null;
  techStack: string[];
  active: boolean;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  orderIndex: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getIndustries(): Promise<{ success: boolean; data: AdminIndustry[]; error?: string }> {
  try {
    const rows = await db.industryItem.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return {
      success: true,
      data: rows.map(r => ({
        id: r.id,
        slug: r.slug,
        code: r.code,
        label: r.label,
        tagline: r.tagline,
        headline: r.headline,
        image: r.image,
        imageAlt: r.imageAlt,
        accentColor: r.accentColor,
        statusText: r.statusText,
        complianceBadge: r.complianceBadge,
        challenge: r.challenge,
        solution: r.solution,
        techStack: r.techStack || [],
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
    console.error('[getIndustries error]:', err);
    return { success: false, data: [], error: (err as Error)?.message || 'Failed to fetch industries.' };
  }
}

export async function createIndustry(data: {
  slug: string;
  code?: string;
  label: string;
  tagline?: string;
  headline?: string;
  image?: string;
  imageAlt?: string;
  accentColor?: string;
  statusText?: string;
  complianceBadge?: string;
  challenge?: string;
  solution?: string;
  techStack: string[];
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

    await db.industryItem.create({
      data: {
        slug: data.slug.trim().toLowerCase(),
        code: data.code?.trim() || null,
        label: data.label.trim(),
        tagline: data.tagline?.trim() || null,
        headline: data.headline?.trim() || null,
        image: data.image?.trim() || null,
        imageAlt: data.imageAlt?.trim() || null,
        accentColor: data.accentColor?.trim() || null,
        statusText: data.statusText?.trim() || null,
        complianceBadge: data.complianceBadge?.trim() || null,
        challenge: data.challenge?.trim() || null,
        solution: data.solution?.trim() || null,
        techStack: data.techStack || [],
        active: data.active ?? true,
        status: data.status || 'published',
        featured: data.featured ?? false,
        orderIndex: data.orderIndex ?? 0,
        metaTitle: data.metaTitle?.trim() || null,
        metaDescription: data.metaDescription?.trim() || null
      }
    });

    await logAuditAction({ action: 'CREATE_INDUSTRY', entityType: 'industry', entityId: data.slug });
    revalidatePath('/industries');
    return { success: true };
  } catch (err: unknown) {
    console.error('[createIndustry error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to create industry.' };
  }
}

export async function updateIndustry(id: string, data: Partial<AdminIndustry>): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.industryItem.update({
      where: { id },
      data: {
        ...(data.slug ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(data.code !== undefined ? { code: data.code } : {}),
        ...(data.label ? { label: data.label.trim() } : {}),
        ...(data.tagline !== undefined ? { tagline: data.tagline } : {}),
        ...(data.headline !== undefined ? { headline: data.headline } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(data.imageAlt !== undefined ? { imageAlt: data.imageAlt } : {}),
        ...(data.accentColor !== undefined ? { accentColor: data.accentColor } : {}),
        ...(data.statusText !== undefined ? { statusText: data.statusText } : {}),
        ...(data.complianceBadge !== undefined ? { complianceBadge: data.complianceBadge } : {}),
        ...(data.challenge !== undefined ? { challenge: data.challenge } : {}),
        ...(data.solution !== undefined ? { solution: data.solution } : {}),
        ...(data.techStack !== undefined ? { techStack: data.techStack } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        ...(data.metaTitle !== undefined ? { metaTitle: data.metaTitle } : {}),
        ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription } : {}),
        updatedAt: new Date()
      }
    });

    await logAuditAction({ action: 'UPDATE_INDUSTRY', entityType: 'industry', entityId: id });
    revalidatePath('/industries');
    return { success: true };
  } catch (err: unknown) {
    console.error('[updateIndustry error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update industry.' };
  }
}

export async function deleteIndustry(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.industryItem.delete({ where: { id } });
    await logAuditAction({ action: 'DELETE_INDUSTRY', entityType: 'industry', entityId: id });
    revalidatePath('/industries');
    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteIndustry error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete industry.' };
  }
}
