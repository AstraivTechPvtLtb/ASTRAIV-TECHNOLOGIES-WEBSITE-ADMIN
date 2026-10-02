'use server';

/**
 * @file admin/src/controllers/publishing.controller.ts
 * @description [CONTROLLER] Visibility & ISR Cache Revalidation Controller.
 */

import { revalidatePath } from 'next/cache';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';

export async function revalidatePublicCaches(paths: string[]): Promise<{ success: boolean; revalidated: string[]; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, revalidated: [], error: 'Unauthorized' };

    const revalidated: string[] = [];
    for (const path of paths) {
      try {
        revalidatePath(path);
        revalidated.push(path);
      } catch (e) {
        console.warn(`Failed to revalidate path: ${path}`, e);
      }
    }

    await logAuditAction({ action: 'PURGE_CACHE', entityType: 'cache', details: { paths: revalidated } });
    return { success: true, revalidated };
  } catch (err: unknown) {
    console.error('[revalidatePublicCaches error]:', err);
    return { success: false, revalidated: [], error: (err as Error)?.message || 'Failed to revalidate caches.' };
  }
}
