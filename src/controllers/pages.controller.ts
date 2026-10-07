'use server';

/**
 * @file admin/src/controllers/pages.controller.ts
 * @description [CONTROLLER] Standalone Static Pages Content Controller (Homepage, Company, Process).
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';
import { triggerClientRevalidation } from '@/lib/revalidate-client';

export interface AdminPageContent {
  id: string;
  pageKey: string;
  title: string;
  sections: Record<string, unknown>;
  metaTitle?: string | null;
  metaDescription?: string | null;
  status: 'published' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export async function getPageContent(pageKey: string): Promise<{ success: boolean; data?: AdminPageContent; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (db as any).pageContent.findUnique({
      where: { pageKey }
    });

    if (!page) {
      return { success: true, data: undefined };
    }

    return {
      success: true,
      data: {
        id: page.id,
        pageKey: page.pageKey,
        title: page.title,
        sections: (typeof page.sections === 'string' ? JSON.parse(page.sections) : page.sections) as Record<string, unknown>,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        status: (page.status as 'published' | 'draft') || 'published',
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      }
    };
  } catch (err: unknown) {
    console.error(`[getPageContent error for ${pageKey}]:`, err);
    return { success: false, error: (err as Error)?.message || 'Failed to fetch page content.' };
  }
}

export async function savePageContent(data: {
  pageKey: string;
  title: string;
  sections: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  status?: 'published' | 'draft';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).pageContent.upsert({
      where: { pageKey: data.pageKey },
      update: {
        title: data.title.trim(),
        sections: data.sections as object,
        metaTitle: data.metaTitle?.trim() || null,
        metaDescription: data.metaDescription?.trim() || null,
        status: data.status || 'published',
        updatedAt: new Date()
      },
      create: {
        pageKey: data.pageKey,
        title: data.title.trim(),
        sections: data.sections as object,
        metaTitle: data.metaTitle?.trim() || null,
        metaDescription: data.metaDescription?.trim() || null,
        status: data.status || 'published'
      }
    });

    await logAuditAction({ action: 'SAVE_PAGE_CONTENT', entityType: 'page', entityId: data.pageKey });
    revalidatePath('/');
    revalidatePath(`/${data.pageKey}`);

    // Synchronize and revalidate public client CDN / edge caches immediately
    const clientPaths =
      data.pageKey === 'homepage'
        ? ['/']
        : data.pageKey === 'process'
          ? ['/', '/company']
          : [`/${data.pageKey}`];

    await triggerClientRevalidation(clientPaths);

    return { success: true };
  } catch (err: unknown) {
    console.error('[savePageContent error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to save page content.' };
  }
}
