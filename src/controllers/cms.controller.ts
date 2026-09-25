'use server';

/**
 * @file admin/src/controllers/cms.controller.ts
 * @description [CONTROLLER] Admin Relational CMS Management Controller.
 * Controls publication status, featured flags, display ordering, SEO metadata, and cross-entity relationships.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import {
  AdminActionResponse,
  CmsEntityPublicationUpdate,
  CmsEntityFeaturedUpdate,
  CmsEntityOrderUpdate,
  CmsEntitySeoUpdate,
  CmsEntityRelationshipUpdate,
} from '@/models/types';
import { requireAdminUser } from './auth.controller';

/**
 * Updates publication or active status for a given CMS entity.
 */
export async function updateEntityPublicationStatus(
  entityType: 'service' | 'solution' | 'industry' | 'case_study' | 'article' | 'award' | 'faq' | 'job',
  payload: CmsEntityPublicationUpdate
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const { id, status, published, active } = payload;

    switch (entityType) {
      case 'service':
        await db.serviceItem.update({
          where: { id },
          data: {
            status: status || (active ? 'published' : 'draft'),
            active: active !== undefined ? active : status === 'published',
          },
        });
        break;

      case 'solution':
        await db.solutionItem.update({
          where: { id },
          data: {
            status: status || (active ? 'published' : 'draft'),
            active: active !== undefined ? active : status === 'published',
          },
        });
        break;

      case 'industry':
        await db.industryItem.update({
          where: { id },
          data: {
            status: status || (active ? 'published' : 'draft'),
            active: active !== undefined ? active : status === 'published',
          },
        });
        break;

      case 'case_study':
        await db.portfolioProject.update({
          where: { id },
          data: {
            status: status || (published ? 'published' : 'draft'),
            published: published !== undefined ? published : status === 'published',
          },
        });
        break;

      case 'article':
        await db.blogPost.update({
          where: { id },
          data: {
            status: status || (published ? 'published' : 'draft'),
            published: published !== undefined ? published : status === 'published',
          },
        });
        break;

      case 'award':
        await db.awardItem.update({
          where: { id },
          data: {
            published: published !== undefined ? published : true,
            status: status || 'verified',
          },
        });
        break;

      case 'faq':
        await db.faqItem.update({
          where: { id },
          data: {
            status: status || 'published',
          },
        });
        break;

      case 'job':
        await db.jobOpening.update({
          where: { id },
          data: {
            active: active !== undefined ? active : true,
            status: status || 'active',
          },
        });
        break;
    }

    revalidatePath('/services');
    revalidatePath('/projects');
    revalidatePath('/blog');
    return { success: true, message: `${entityType} publication status updated successfully.` };
  } catch (err) {
    console.error(`[Admin CMS Status Update Error - ${entityType}]:`, err);
    return { success: false, error: (err as Error)?.message || 'Failed to update publication status' };
  }
}

/**
 * Toggles or updates featured status for a CMS entity.
 */
export async function updateEntityFeatured(
  entityType: 'service' | 'solution' | 'industry' | 'case_study' | 'article' | 'award' | 'faq',
  payload: CmsEntityFeaturedUpdate
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const { id, featured } = payload;

    switch (entityType) {
      case 'service':
        await db.serviceItem.update({ where: { id }, data: { featured } });
        break;
      case 'solution':
        await db.solutionItem.update({ where: { id }, data: { featured } });
        break;
      case 'industry':
        await db.industryItem.update({ where: { id }, data: { featured } });
        break;
      case 'case_study':
        await db.portfolioProject.update({ where: { id }, data: { featured } });
        break;
      case 'article':
        await db.blogPost.update({ where: { id }, data: { featured } });
        break;
      case 'award':
        await db.awardItem.update({ where: { id }, data: { featured } });
        break;
      case 'faq':
        await db.faqItem.update({ where: { id }, data: { isFeatured: featured } });
        break;
    }

    return { success: true, message: `${entityType} featured status updated successfully.` };
  } catch (err) {
    console.error(`[Admin CMS Featured Update Error - ${entityType}]:`, err);
    return { success: false, error: (err as Error)?.message || 'Failed to update featured flag' };
  }
}

/**
 * Updates display order for a CMS entity.
 */
export async function updateEntityDisplayOrder(
  entityType: 'service' | 'solution' | 'industry' | 'case_study' | 'article' | 'award' | 'faq' | 'job',
  payload: CmsEntityOrderUpdate
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const { id, orderIndex } = payload;

    switch (entityType) {
      case 'service':
        await db.serviceItem.update({ where: { id }, data: { orderIndex } });
        break;
      case 'solution':
        await db.solutionItem.update({ where: { id }, data: { orderIndex } });
        break;
      case 'industry':
        await db.industryItem.update({ where: { id }, data: { orderIndex } });
        break;
      case 'case_study':
        await db.portfolioProject.update({ where: { id }, data: { orderIndex } });
        break;
      case 'article':
        await db.blogPost.update({ where: { id }, data: { orderIndex } });
        break;
      case 'award':
        await db.awardItem.update({ where: { id }, data: { orderIndex } });
        break;
      case 'faq':
        await db.faqItem.update({ where: { id }, data: { orderIndex } });
        break;
      case 'job':
        await db.jobOpening.update({ where: { id }, data: { orderIndex } });
        break;
    }

    return { success: true, message: `${entityType} display order updated.` };
  } catch (err) {
    console.error(`[Admin CMS Order Update Error - ${entityType}]:`, err);
    return { success: false, error: (err as Error)?.message || 'Failed to update order' };
  }
}

/**
 * Updates SEO metadata for a CMS entity.
 */
export async function updateEntitySeoMetadata(
  entityType: 'service' | 'solution' | 'industry' | 'case_study' | 'article',
  payload: CmsEntitySeoUpdate
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const { id, metaTitle, metaDescription } = payload;

    switch (entityType) {
      case 'service':
        await db.serviceItem.update({ where: { id }, data: { metaTitle, metaDescription } });
        break;
      case 'solution':
        await db.solutionItem.update({ where: { id }, data: { metaTitle, metaDescription } });
        break;
      case 'industry':
        await db.industryItem.update({ where: { id }, data: { metaTitle, metaDescription } });
        break;
      case 'case_study':
        await db.portfolioProject.update({ where: { id }, data: { metaTitle, metaDescription } });
        break;
      case 'article':
        await db.blogPost.update({ where: { id }, data: { metaTitle, metaDescription } });
        break;
    }

    return { success: true, message: `${entityType} SEO metadata updated successfully.` };
  } catch (err) {
    console.error(`[Admin CMS SEO Update Error - ${entityType}]:`, err);
    return { success: false, error: (err as Error)?.message || 'Failed to update SEO metadata' };
  }
}

/**
 * Updates bidirectional relationship join rows between entities.
 */
export async function updateEntityRelationships(
  payload: CmsEntityRelationshipUpdate
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const { sourceEntityType, sourceId, targetEntityType, targetIds } = payload;

    if (sourceEntityType === 'service' && targetEntityType === 'solution') {
      await db.serviceSolution.deleteMany({ where: { serviceId: sourceId } });
      if (targetIds.length > 0) {
        await db.serviceSolution.createMany({
          data: targetIds.map((solId, idx) => ({
            serviceId: sourceId,
            solutionId: solId,
            orderIndex: idx + 1,
          })),
        });
      }
    } else if (sourceEntityType === 'service' && targetEntityType === 'industry') {
      await db.serviceIndustry.deleteMany({ where: { serviceId: sourceId } });
      if (targetIds.length > 0) {
        await db.serviceIndustry.createMany({
          data: targetIds.map((indId, idx) => ({
            serviceId: sourceId,
            industryId: indId,
            orderIndex: idx + 1,
          })),
        });
      }
    } else if (sourceEntityType === 'case_study' && targetEntityType === 'service') {
      await db.caseStudyService.deleteMany({ where: { caseStudyId: sourceId } });
      if (targetIds.length > 0) {
        await db.caseStudyService.createMany({
          data: targetIds.map((srvId, idx) => ({
            caseStudyId: sourceId,
            serviceId: srvId,
            orderIndex: idx + 1,
          })),
        });
      }
    } else if (sourceEntityType === 'case_study' && targetEntityType === 'solution') {
      await db.caseStudySolution.deleteMany({ where: { caseStudyId: sourceId } });
      if (targetIds.length > 0) {
        await db.caseStudySolution.createMany({
          data: targetIds.map((solId, idx) => ({
            caseStudyId: sourceId,
            solutionId: solId,
            orderIndex: idx + 1,
          })),
        });
      }
    }

    return { success: true, message: `Relationships between ${sourceEntityType} and ${targetEntityType} updated.` };
  } catch (err) {
    console.error('[Admin CMS Relationship Update Error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update relationships' };
  }
}
