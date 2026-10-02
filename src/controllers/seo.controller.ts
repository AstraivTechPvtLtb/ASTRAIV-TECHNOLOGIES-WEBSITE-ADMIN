'use server';

/**
 * @file admin/src/controllers/seo.controller.ts
 * @description [CONTROLLER] SEO Governance & URL Slug Redirects Controller.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface SeoAuditItem {
  entityType: 'service' | 'solution' | 'industry' | 'project' | 'article' | 'page';
  entityId: string;
  title: string;
  slug: string;
  urlPath: string;
  metaTitle: string | null;
  metaDescription: string | null;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  isComplete: boolean;
  status: string;
}

export interface SlugRedirectItem {
  id: string;
  sourcePath: string;
  destinationPath: string;
  statusCode: number;
  entityType: string | null;
  entityId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scans all public CMS entities and generates a centralized SEO completeness audit.
 */
export async function getSeoAudit(): Promise<{
  success: boolean;
  summary: { total: number; complete: number; missing: number; completenessPercent: number };
  items: SeoAuditItem[];
  error?: string;
}> {
  try {
    const [services, solutions, industries, projects, articles] = await Promise.all([
      db.serviceItem.findMany({ where: { active: true } }),
      db.solutionItem.findMany({ where: { active: true } }),
      db.industryItem.findMany({ where: { active: true } }),
      db.portfolioProject.findMany({ where: { published: true } }),
      db.blogPost.findMany({ where: { published: true } })
    ]);

    const items: SeoAuditItem[] = [];

    services.forEach(s => {
      const hasMetaTitle = Boolean(s.metaTitle?.trim());
      const hasMetaDescription = Boolean(s.metaDescription?.trim());
      items.push({
        entityType: 'service',
        entityId: s.id,
        title: s.title,
        slug: s.slug,
        urlPath: `/services/${s.slug}`,
        metaTitle: s.metaTitle,
        metaDescription: s.metaDescription,
        hasMetaTitle,
        hasMetaDescription,
        isComplete: hasMetaTitle && hasMetaDescription,
        status: s.status
      });
    });

    solutions.forEach(s => {
      const hasMetaTitle = Boolean(s.metaTitle?.trim());
      const hasMetaDescription = Boolean(s.metaDescription?.trim());
      items.push({
        entityType: 'solution',
        entityId: s.id,
        title: s.title,
        slug: s.slug,
        urlPath: `/solutions/${s.slug}`,
        metaTitle: s.metaTitle,
        metaDescription: s.metaDescription,
        hasMetaTitle,
        hasMetaDescription,
        isComplete: hasMetaTitle && hasMetaDescription,
        status: s.status
      });
    });

    industries.forEach(i => {
      const hasMetaTitle = Boolean(i.metaTitle?.trim());
      const hasMetaDescription = Boolean(i.metaDescription?.trim());
      items.push({
        entityType: 'industry',
        entityId: i.id,
        title: i.label,
        slug: i.slug,
        urlPath: `/industries/${i.slug}`,
        metaTitle: i.metaTitle,
        metaDescription: i.metaDescription,
        hasMetaTitle,
        hasMetaDescription,
        isComplete: hasMetaTitle && hasMetaDescription,
        status: i.status
      });
    });

    projects.forEach(p => {
      const hasMetaTitle = Boolean(p.metaTitle?.trim());
      const hasMetaDescription = Boolean(p.metaDescription?.trim());
      items.push({
        entityType: 'project',
        entityId: p.id,
        title: p.title,
        slug: p.slug,
        urlPath: `/work/${p.slug}`,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        hasMetaTitle,
        hasMetaDescription,
        isComplete: hasMetaTitle && hasMetaDescription,
        status: p.status
      });
    });

    articles.forEach(a => {
      const hasMetaTitle = Boolean(a.metaTitle?.trim());
      const hasMetaDescription = Boolean(a.metaDescription?.trim());
      items.push({
        entityType: 'article',
        entityId: a.id,
        title: a.title,
        slug: a.slug,
        urlPath: `/blog/${a.slug}`,
        metaTitle: a.metaTitle,
        metaDescription: a.metaDescription,
        hasMetaTitle,
        hasMetaDescription,
        isComplete: hasMetaTitle && hasMetaDescription,
        status: a.status
      });
    });

    const total = items.length;
    const complete = items.filter(i => i.isComplete).length;
    const missing = total - complete;
    const completenessPercent = total > 0 ? Math.round((complete / total) * 100) : 100;

    return {
      success: true,
      summary: { total, complete, missing, completenessPercent },
      items
    };
  } catch (err: unknown) {
    console.error('[getSeoAudit error]:', err);
    return {
      success: false,
      summary: { total: 0, complete: 0, missing: 0, completenessPercent: 0 },
      items: [],
      error: (err as Error)?.message || 'Failed to generate SEO audit.'
    };
  }
}

/**
 * Retrieves all registered slug redirects.
 */
export async function getSlugRedirects(): Promise<{ success: boolean; data: SlugRedirectItem[]; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any).slugRedirect.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: rows };
  } catch (err: unknown) {
    console.error('[getSlugRedirects error]:', err);
    return { success: false, data: [], error: (err as Error)?.message || 'Failed to fetch redirects.' };
  }
}

/**
 * Creates a URL redirect rule.
 */
export async function createSlugRedirect(data: {
  sourcePath: string;
  destinationPath: string;
  statusCode?: number;
  entityType?: string;
  entityId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    let src = data.sourcePath.trim();
    if (!src.startsWith('/')) src = '/' + src;
    let dst = data.destinationPath.trim();
    if (!dst.startsWith('/')) dst = '/' + dst;

    if (src === dst) {
      return { success: false, error: 'Source and destination paths cannot be identical.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).slugRedirect.create({
      data: {
        sourcePath: src,
        destinationPath: dst,
        statusCode: data.statusCode || 301,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        active: true
      }
    });

    await logAuditAction({ action: 'CREATE_REDIRECT', entityType: 'redirect', details: { from: src, to: dst } });
    return { success: true };
  } catch (err: unknown) {
    console.error('[createSlugRedirect error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to create redirect.' };
  }
}

/**
 * Deletes a redirect rule.
 */
export async function deleteSlugRedirect(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).slugRedirect.delete({ where: { id } });
    await logAuditAction({ action: 'DELETE_REDIRECT', entityType: 'redirect', entityId: id });
    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteSlugRedirect error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete redirect.' };
  }
}
