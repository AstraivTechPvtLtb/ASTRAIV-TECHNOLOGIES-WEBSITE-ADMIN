'use server';

/**
 * @file admin/src/controllers/relationships.controller.ts
 * @description [CONTROLLER] Bidirectional Entity Relationship Controller.
 */

import { db } from '@/models/db';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface EntitySummary {
  id: string;
  type: 'service' | 'solution' | 'industry' | 'technology' | 'project' | 'article';
  title: string;
  slug: string;
  category?: string | null;
  status: string;
}

export interface RelationshipGraphData {
  entities: EntitySummary[];
  connections: {
    fromId: string;
    fromType: string;
    toId: string;
    toType: string;
    orderIndex?: number;
  }[];
}

/**
 * Fetches all core entities and their bidirectional relation links for the Relationship Explorer.
 */
export async function getRelationshipGraph(): Promise<{ success: boolean; data?: RelationshipGraphData; error?: string }> {
  try {
    const [services, solutions, industries, technologies, projects, articles] = await Promise.all([
      db.serviceItem.findMany({ select: { id: true, title: true, slug: true, category: true, status: true } }),
      db.solutionItem.findMany({ select: { id: true, title: true, slug: true, category: true, status: true } }),
      db.industryItem.findMany({ select: { id: true, label: true, slug: true, status: true } }),
      db.technologyItem.findMany({ select: { id: true, name: true, slug: true, category: true, status: true } }),
      db.portfolioProject.findMany({ select: { id: true, title: true, slug: true, category: true, status: true } }),
      db.blogPost.findMany({ select: { id: true, title: true, slug: true, status: true } })
    ]);

    const [serviceSolutions, serviceIndustries, serviceTechnologies, caseStudyServices, caseStudyTechs] = await Promise.all([
      db.serviceSolution.findMany(),
      db.serviceIndustry.findMany(),
      db.serviceTechnology.findMany(),
      db.caseStudyService.findMany(),
      db.caseStudyTechnology.findMany()
    ]);

    const entities: EntitySummary[] = [
      ...services.map(s => ({ id: s.id, type: 'service' as const, title: s.title, slug: s.slug, category: s.category, status: s.status })),
      ...solutions.map(s => ({ id: s.id, type: 'solution' as const, title: s.title, slug: s.slug, category: s.category, status: s.status })),
      ...industries.map(i => ({ id: i.id, type: 'industry' as const, title: i.label, slug: i.slug, category: 'Industry', status: i.status })),
      ...technologies.map(t => ({ id: t.id, type: 'technology' as const, title: t.name, slug: t.slug, category: t.category, status: t.status })),
      ...projects.map(p => ({ id: p.id, type: 'project' as const, title: p.title, slug: p.slug, category: p.category, status: p.status })),
      ...articles.map(a => ({ id: a.id, type: 'article' as const, title: a.title, slug: a.slug, category: 'Article', status: a.status }))
    ];

    const connections: RelationshipGraphData['connections'] = [
      ...serviceSolutions.map(c => ({ fromId: c.serviceId, fromType: 'service', toId: c.solutionId, toType: 'solution', orderIndex: c.orderIndex })),
      ...serviceIndustries.map(c => ({ fromId: c.serviceId, fromType: 'service', toId: c.industryId, toType: 'industry', orderIndex: c.orderIndex })),
      ...serviceTechnologies.map(c => ({ fromId: c.serviceId, fromType: 'service', toId: c.technologyId, toType: 'technology', orderIndex: c.orderIndex })),
      ...caseStudyServices.map(c => ({ fromId: c.caseStudyId, fromType: 'project', toId: c.serviceId, toType: 'service', orderIndex: c.orderIndex })),
      ...caseStudyTechs.map(c => ({ fromId: c.caseStudyId, fromType: 'project', toId: c.technologyId, toType: 'technology', orderIndex: c.orderIndex }))
    ];

    return {
      success: true,
      data: { entities, connections }
    };
  } catch (err: unknown) {
    console.error('[getRelationshipGraph error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to fetch relationship graph.' };
  }
}

/**
 * Connects a Service to a Technology.
 */
export async function linkServiceToTechnology(serviceId: string, technologyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.serviceTechnology.upsert({
      where: {
        serviceId_technologyId: { serviceId, technologyId }
      },
      update: {},
      create: {
        serviceId,
        technologyId
      }
    });

    await logAuditAction({ action: 'LINK_SERVICE_TECH', entityType: 'relationship', details: { serviceId, technologyId } });
    return { success: true };
  } catch (err: unknown) {
    console.error('[linkServiceToTechnology error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to link service to technology.' };
  }
}

/**
 * Disconnects a Service from a Technology.
 */
export async function unlinkServiceFromTechnology(serviceId: string, technologyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.serviceTechnology.deleteMany({
      where: { serviceId, technologyId }
    });

    await logAuditAction({ action: 'UNLINK_SERVICE_TECH', entityType: 'relationship', details: { serviceId, technologyId } });
    return { success: true };
  } catch (err: unknown) {
    console.error('[unlinkServiceFromTechnology error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to unlink service from technology.' };
  }
}
