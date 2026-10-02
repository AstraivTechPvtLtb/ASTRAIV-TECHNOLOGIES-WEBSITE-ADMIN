'use server';

/**
 * @file admin/src/controllers/trust.controller.ts
 * @description [CONTROLLER] Trust & Credentials CMS Controller (Awards, Certifications, Partnerships, Claims/Evidence).
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface AdminAward {
  id: string;
  type: 'award' | 'certification' | 'partnership' | 'recognition';
  title: string;
  organization: string;
  year: string;
  category: string;
  description: string;
  achievement: string;
  verificationUrl?: string | null;
  verificationLabel?: string | null;
  badgeText: string;
  status: 'verified' | 'active' | 'contractual' | 'illustrative' | 'target';
  published: boolean;
  featured: boolean;
  orderIndex: number;
  icon: string;
  highlights: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getAwards(): Promise<{ success: boolean; data: AdminAward[]; error?: string }> {
  try {
    const rows = await db.awardItem.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return {
      success: true,
      data: rows.map(r => ({
        id: r.id,
        type: (r.type as AdminAward['type']) || 'award',
        title: r.title,
        organization: r.organization,
        year: r.year,
        category: r.category,
        description: r.description,
        achievement: r.achievement,
        verificationUrl: r.verificationUrl,
        verificationLabel: r.verificationLabel,
        badgeText: r.badgeText,
        status: (r.status as AdminAward['status']) || 'verified',
        published: r.published,
        featured: r.featured,
        orderIndex: r.orderIndex,
        icon: r.icon,
        highlights: r.highlights || [],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    };
  } catch (err: unknown) {
    console.error('[getAwards error]:', err);
    return { success: false, data: [], error: (err as Error)?.message || 'Failed to fetch awards.' };
  }
}

export async function createAward(data: {
  type: 'award' | 'certification' | 'partnership' | 'recognition';
  title: string;
  organization: string;
  year: string;
  category: string;
  description: string;
  achievement: string;
  verificationUrl?: string;
  verificationLabel?: string;
  badgeText: string;
  status?: 'verified' | 'active' | 'contractual' | 'illustrative' | 'target';
  published?: boolean;
  featured?: boolean;
  orderIndex?: number;
  icon?: string;
  highlights?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.awardItem.create({
      data: {
        type: data.type,
        title: data.title.trim(),
        organization: data.organization.trim(),
        year: data.year.trim(),
        category: data.category.trim(),
        description: data.description.trim(),
        achievement: data.achievement.trim(),
        verificationUrl: data.verificationUrl?.trim() || null,
        verificationLabel: data.verificationLabel?.trim() || null,
        badgeText: data.badgeText.trim(),
        status: data.status || 'verified',
        published: data.published ?? true,
        featured: data.featured ?? false,
        orderIndex: data.orderIndex ?? 0,
        icon: data.icon?.trim() || 'Award',
        highlights: data.highlights || []
      }
    });

    await logAuditAction({ action: 'CREATE_AWARD', entityType: 'award', details: { title: data.title } });
    revalidatePath('/company');
    return { success: true };
  } catch (err: unknown) {
    console.error('[createAward error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to create award.' };
  }
}

export async function updateAward(id: string, data: Partial<AdminAward>): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.awardItem.update({
      where: { id },
      data: {
        ...(data.type ? { type: data.type } : {}),
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.organization ? { organization: data.organization.trim() } : {}),
        ...(data.year ? { year: data.year.trim() } : {}),
        ...(data.category ? { category: data.category.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.achievement ? { achievement: data.achievement.trim() } : {}),
        ...(data.verificationUrl !== undefined ? { verificationUrl: data.verificationUrl } : {}),
        ...(data.verificationLabel !== undefined ? { verificationLabel: data.verificationLabel } : {}),
        ...(data.badgeText ? { badgeText: data.badgeText.trim() } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.published !== undefined ? { published: data.published } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        ...(data.icon ? { icon: data.icon.trim() } : {}),
        ...(data.highlights !== undefined ? { highlights: data.highlights } : {}),
        updatedAt: new Date()
      }
    });

    await logAuditAction({ action: 'UPDATE_AWARD', entityType: 'award', entityId: id });
    revalidatePath('/company');
    return { success: true };
  } catch (err: unknown) {
    console.error('[updateAward error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update award.' };
  }
}

export async function deleteAward(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.awardItem.delete({ where: { id } });
    await logAuditAction({ action: 'DELETE_AWARD', entityType: 'award', entityId: id });
    revalidatePath('/company');
    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteAward error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete award.' };
  }
}
