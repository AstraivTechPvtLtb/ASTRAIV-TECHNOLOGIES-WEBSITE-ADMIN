'use server';

/**
 * @file admin/src/controllers/media.controller.ts
 * @description [CONTROLLER] Media Library & Asset Governance Controller.
 */

import { db } from '@/models/db';
import { getAdminUser } from './auth.controller';
import { logAuditAction } from './audit.controller';
import type { MediaSlotSpec, MediaAssetItem } from '@/lib/media-specs';
import { sanitizeSvgContent as pureSanitizeSvg } from '@/lib/media-specs';

/**
 * Server Action for SVG Sanitization
 */
export async function sanitizeSvgContent(rawSvg: string): Promise<string> {
  return pureSanitizeSvg(rawSvg);
}

/**
 * Retrieves all registered media assets from the library.
 */
export async function getMediaAssets(slotFilter?: string): Promise<{ success: boolean; data: MediaAssetItem[]; error?: string }> {
  try {
    const where = slotFilter ? { slot: slotFilter } : {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any).mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: rows
    };
  } catch (err: unknown) {
    console.error('[getMediaAssets error]:', err);
    return { success: false, data: [], error: (err as Error)?.message || 'Failed to fetch media assets.' };
  }
}

/**
 * Registers an uploaded media asset with its verified metadata.
 */
export async function registerMediaAsset(data: {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  altText?: string;
  caption?: string;
  focalPoint?: string;
  slot?: string;
  isPrivate?: boolean;
}): Promise<{ success: boolean; asset?: MediaAssetItem; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await (db as any).mediaAsset.create({
      data: {
        url: data.url.trim(),
        filename: data.filename.trim(),
        mimeType: data.mimeType.trim(),
        sizeBytes: data.sizeBytes,
        width: data.width || null,
        height: data.height || null,
        aspectRatio: data.aspectRatio || null,
        altText: data.altText?.trim() || null,
        caption: data.caption?.trim() || null,
        focalPoint: data.focalPoint?.trim() || 'center',
        slot: data.slot || null,
        isPrivate: data.isPrivate ?? false,
        usageCount: 0
      }
    });

    await logAuditAction({ action: 'REGISTER_MEDIA_ASSET', entityType: 'media', entityId: created.id, details: { filename: data.filename, size: data.sizeBytes } });
    return { success: true, asset: created };
  } catch (err: unknown) {
    console.error('[registerMediaAsset error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to register media asset.' };
  }
}

/**
 * Updates an existing media asset's metadata (alt text, caption, focal point).
 */
export async function updateMediaAsset(id: string, data: {
  altText?: string;
  caption?: string;
  focalPoint?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).mediaAsset.update({
      where: { id },
      data: {
        ...(data.altText !== undefined ? { altText: data.altText.trim() } : {}),
        ...(data.caption !== undefined ? { caption: data.caption.trim() } : {}),
        ...(data.focalPoint !== undefined ? { focalPoint: data.focalPoint.trim() } : {}),
        updatedAt: new Date()
      }
    });

    return { success: true };
  } catch (err: unknown) {
    console.error('[updateMediaAsset error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update media asset.' };
  }
}

/**
 * Safe deletion of an unreferenced media asset.
 */
export async function deleteMediaAsset(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAdminUser();
    if (!admin) return { success: false, error: 'Unauthorized' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asset = await (db as any).mediaAsset.findUnique({ where: { id } });
    if (!asset) return { success: false, error: 'Asset not found.' };

    if (asset.usageCount > 0) {
      return { success: false, error: `Cannot delete media asset because it is referenced in ${asset.usageCount} active public entities. Please unlink or replace it first.` };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).mediaAsset.delete({ where: { id } });
    await logAuditAction({ action: 'DELETE_MEDIA_ASSET', entityType: 'media', entityId: id, details: { filename: asset.filename } });
    return { success: true };
  } catch (err: unknown) {
    console.error('[deleteMediaAsset error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete media asset.' };
  }
}
