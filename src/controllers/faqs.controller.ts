'use server';

/**
 * @file admin/src/controllers/faqs.controller.ts
 * @description [CONTROLLER] Frequently Asked Questions (FAQs) CMS Controller.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export interface AdminFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
  isFeatured: boolean;
  status: 'published' | 'draft' | 'archived';
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getFaqs(): Promise<{ success: boolean; data: AdminFaq[]; error?: string }> {
  try {
    const rows = await db.faqItem.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return {
      success: true,
      data: rows.map(r => ({
        id: r.id,
        category: r.category,
        question: r.question,
        answer: r.answer,
        isFeatured: r.isFeatured,
        status: (r.status as 'published' | 'draft' | 'archived') || 'published',
        orderIndex: r.orderIndex,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    };
  } catch (err: unknown) {
    console.error('[getFaqs error]:', err);
    return { success: false, data: [], error: (err as Error)?.message || 'Failed to fetch FAQs.' };
  }
}

export async function createFaq(data: {
  category: string;
  question: string;
  answer: string;
  isFeatured?: boolean;
  status?: 'published' | 'draft' | 'archived';
  orderIndex?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.faqItem.create({
      data: {
        category: data.category.trim(),
        question: data.question.trim(),
        answer: data.answer.trim(),
        isFeatured: data.isFeatured ?? false,
        status: data.status || 'published',
        orderIndex: data.orderIndex ?? 0
      }
    });

    await logAuditAction({ action: 'CREATE_FAQ', entityType: 'faq', details: { question: data.question } });
    revalidatePath('/faq');
    return { success: true };
  } catch (err: unknown) {
    console.error('[createFaq error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to create FAQ.' };
  }
}

export async function updateFaq(id: string, data: Partial<AdminFaq>): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.faqItem.update({
      where: { id },
      data: {
        ...(data.category ? { category: data.category.trim() } : {}),
        ...(data.question ? { question: data.question.trim() } : {}),
        ...(data.answer ? { answer: data.answer.trim() } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        updatedAt: new Date()
      }
    });

    await logAuditAction({ action: 'UPDATE_FAQ', entityType: 'faq', entityId: id });
    revalidatePath('/faq');
    return { success: true };
  } catch (err: unknown) {
    console.error('[updateFaq error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update FAQ.' };
  }
}

export async function deleteFaq(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    await db.faqItem.delete({ where: { id } });
    await logAuditAction({ action: 'DELETE_FAQ', entityType: 'faq', entityId: id });
    revalidatePath('/faq');
    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteFaq error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete FAQ.' };
  }
}
