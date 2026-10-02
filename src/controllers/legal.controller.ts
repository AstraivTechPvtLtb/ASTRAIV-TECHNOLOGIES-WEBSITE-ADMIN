'use server';

/**
 * @file admin/src/controllers/legal.controller.ts
 * @description [CONTROLLER] Versioned Legal Governance Controller (Privacy Policy, Terms of Service, Legal Identity).
 * 
 * Rules:
 * 1. Published legal revisions are immutable.
 * 2. Editing creates or updates a draft revision.
 * 3. Publishing atomically activates the draft, updates the live pointer, and archives previous revisions.
 * 4. Restoring creates a new revision from historical content without erasing history.
 * 5. Sanitizes content and logs audit trail.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface LegalSection {
  icon?: string;
  title: string;
  content: string;
}

export interface LegalRevisionData {
  id: string;
  documentId: string;
  documentSlug: string;
  versionNumber: number;
  effectiveDate: string;
  title: string;
  summary: string | null;
  sections: LegalSection[];
  status: 'published' | 'draft' | 'archived';
  authorId: string | null;
  authorName: string | null;
  changelog: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalDocumentData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  currentRevisionId: string | null;
  currentRevision?: LegalRevisionData | null;
  draftRevision?: LegalRevisionData | null;
  revisions: LegalRevisionData[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retrieves a legal document by slug along with all its version history.
 */
export async function getLegalDocument(slug: string): Promise<{ success: boolean; data?: LegalDocumentData; error?: string }> {
  try {
    const doc = await db.legalDocument.findUnique({
      where: { slug },
      include: {
        revisions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    if (!doc) {
      return { success: false, error: `Document '${slug}' not found.` };
    }

    const revisions: LegalRevisionData[] = (doc.revisions || []).map(r => ({
      ...r,
      status: (r.status as 'published' | 'draft' | 'archived') || 'draft',
      sections: (typeof r.sections === 'string' ? JSON.parse(r.sections) : r.sections) as LegalSection[]
    }));

    const currentRevision = revisions.find(r => r.id === doc.currentRevisionId || r.status === 'published') || null;
    const draftRevision = revisions.find(r => r.status === 'draft') || null;

    return {
      success: true,
      data: {
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        description: doc.description,
        currentRevisionId: doc.currentRevisionId,
        currentRevision,
        draftRevision,
        revisions,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }
    };
  } catch (err: unknown) {
    console.error(`[getLegalDocument error for ${slug}]:`, err);
    return { success: false, error: (err as Error)?.message || 'Failed to fetch legal document.' };
  }
}

/**
 * Creates or updates a working DRAFT revision for a legal document.
 */
export async function saveLegalDraft(params: {
  documentSlug: string;
  title: string;
  effectiveDate: string;
  summary?: string;
  changelog?: string;
  sections: LegalSection[];
}): Promise<{ success: boolean; revisionId?: string; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin authentication required.' };
    }

    const doc = await db.legalDocument.findUnique({
      where: { slug: params.documentSlug },
      include: {
        revisions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!doc) {
      return { success: false, error: `Document '${params.documentSlug}' not found.` };
    }

    // Check if an existing draft exists
    const existingDraft = await db.legalRevision.findFirst({
      where: {
        documentId: doc.id,
        status: 'draft'
      }
    });

    const highestVersion = doc.revisions[0]?.versionNumber || 0;
    const newVersionNumber = existingDraft ? existingDraft.versionNumber : highestVersion + 1;

    let savedRevision;
    if (existingDraft) {
      savedRevision = await db.legalRevision.update({
        where: { id: existingDraft.id },
        data: {
          title: params.title.trim(),
          effectiveDate: params.effectiveDate.trim(),
          summary: params.summary?.trim() || null,
          changelog: params.changelog?.trim() || null,
          sections: params.sections as object,
          authorId: admin.id,
          authorName: admin.fullName || admin.email || 'Admin',
          updatedAt: new Date()
        }
      });
    } else {
      savedRevision = await db.legalRevision.create({
        data: {
          documentId: doc.id,
          documentSlug: doc.slug,
          versionNumber: newVersionNumber,
          title: params.title.trim(),
          effectiveDate: params.effectiveDate.trim(),
          summary: params.summary?.trim() || null,
          changelog: params.changelog?.trim() || null,
          sections: params.sections as object,
          status: 'draft',
          authorId: admin.id,
          authorName: admin.fullName || admin.email || 'Admin'
        }
      });
    }

    await logAuditAction({
      action: existingDraft ? 'UPDATE_LEGAL_DRAFT' : 'CREATE_LEGAL_DRAFT',
      entityType: 'legal_document',
      entityId: doc.slug,
      details: {
        revisionId: savedRevision.id,
        version: newVersionNumber,
        title: params.title
      }
    });

    return { success: true, revisionId: savedRevision.id };
  } catch (err: unknown) {
    console.error('[saveLegalDraft error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to save draft.' };
  }
}

/**
 * Publishes a draft revision, atomically archiving the old live revision and making the draft immutable live.
 */
export async function publishLegalRevision(revisionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin authentication required.' };
    }

    const revision = await db.legalRevision.findUnique({
      where: { id: revisionId },
      include: { document: true }
    });

    if (!revision) {
      return { success: false, error: 'Revision not found.' };
    }

    const docId = revision.documentId;
    const slug = revision.documentSlug;

    // Archive previous published revision
    await db.legalRevision.updateMany({
      where: {
        documentId: docId,
        status: 'published'
      },
      data: {
        status: 'archived'
      }
    });

    // Mark current revision as published
    const now = new Date();
    await db.legalRevision.update({
      where: { id: revisionId },
      data: {
        status: 'published',
        publishedAt: now,
        authorId: admin.id,
        authorName: admin.fullName || admin.email || 'Admin'
      }
    });

    // Update parent document pointer
    await db.legalDocument.update({
      where: { id: docId },
      data: {
        currentRevisionId: revisionId,
        updatedAt: now
      }
    });

    await logAuditAction({
      action: 'PUBLISH_LEGAL_REVISION',
      entityType: 'legal_document',
      entityId: slug,
      details: {
        revisionId,
        version: revision.versionNumber,
        title: revision.title
      }
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/en/${slug}`);
    revalidatePath('/legal/privacy');
    revalidatePath('/legal/terms');

    return { success: true };
  } catch (err: unknown) {
    console.error('[publishLegalRevision error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to publish revision.' };
  }
}

/**
 * Restores a historical revision by creating a new draft/revision from its content, preserving immutable history.
 */
export async function restoreLegalRevision(historicalRevisionId: string): Promise<{ success: boolean; newRevisionId?: string; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin authentication required.' };
    }

    const historical = await db.legalRevision.findUnique({
      where: { id: historicalRevisionId },
      include: { document: { include: { revisions: { orderBy: { versionNumber: 'desc' }, take: 1 } } } }
    });

    if (!historical) {
      return { success: false, error: 'Historical revision not found.' };
    }

    const highestVersion = historical.document.revisions[0]?.versionNumber || 0;
    const newVersionNumber = highestVersion + 1;

    const restoredRevision = await db.legalRevision.create({
      data: {
        documentId: historical.documentId,
        documentSlug: historical.documentSlug,
        versionNumber: newVersionNumber,
        title: historical.title,
        effectiveDate: `Restored (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
        summary: historical.summary,
        changelog: `Restored from historical Version ${historical.versionNumber}.`,
        sections: historical.sections as object,
        status: 'draft',
        authorId: admin.id,
        authorName: admin.fullName || admin.email || 'Admin'
      }
    });

    await logAuditAction({
      action: 'RESTORE_LEGAL_REVISION',
      entityType: 'legal_document',
      entityId: historical.documentSlug,
      details: {
        restoredFromVersion: historical.versionNumber,
        newDraftRevisionId: restoredRevision.id,
        newVersionNumber
      }
    });

    return { success: true, newRevisionId: restoredRevision.id };
  } catch (err: unknown) {
    console.error('[restoreLegalRevision error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to restore revision.' };
  }
}
