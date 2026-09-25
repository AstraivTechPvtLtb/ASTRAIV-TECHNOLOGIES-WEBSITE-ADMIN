'use server';

/**
 * @file admin/src/controllers/footer.controller.ts
 * @description [CONTROLLER] Business logic for managing client footer configuration, contact details, and social media channels.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import {
  AdminFooterSettings,
  AdminFooterSettingsInput,
  AdminSocialLink,
  AdminSocialLinkInput,
  AdminActionResponse,
} from '@/models/types';
import { requireAdminUser } from './auth.controller';

const DEFAULT_SETTINGS = {
  brandTagline: 'Your trusted partner for AI, enterprise software, and scalable cloud systems.',
  phone: '+91 8167409664',
  email: 'info@astraivtechnologies.com',
  address: 'Ashoknagar, Kolkata',
  mapUrl: 'https://maps.google.com/?q=Ashoknagar,+Kolkata',
  copyrightText: 'Astraiv Technologies. All rights reserved.',
};

/**
 * Retrieves footer contact settings and all social accounts.
 */
export async function getFooterData(): Promise<{
  settings: AdminFooterSettings;
  socials: AdminSocialLink[];
  error?: string;
}> {
  try {
    let settingsRecord = await db.footerSetting.findFirst();

    if (!settingsRecord) {
      settingsRecord = await db.footerSetting.create({
        data: DEFAULT_SETTINGS,
      });
    }

    const socialRecords = await db.socialLink.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const settings: AdminFooterSettings = {
      id: settingsRecord.id,
      brandTagline: settingsRecord.brandTagline,
      phone: settingsRecord.phone,
      email: settingsRecord.email,
      address: settingsRecord.address,
      mapUrl: settingsRecord.mapUrl,
      copyrightText: settingsRecord.copyrightText,
      createdAt: settingsRecord.createdAt.toISOString(),
      updatedAt: settingsRecord.updatedAt.toISOString(),
    };

    const socials: AdminSocialLink[] = socialRecords.map((s) => ({
      id: s.id,
      platform: s.platform,
      name: s.name,
      url: s.url,
      icon: s.icon,
      active: s.active,
      orderIndex: s.orderIndex,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return { settings, socials };
  } catch (error) {
    console.error('[Get Footer Data Controller Error]:', error);
    return {
      settings: {
        id: 'fallback',
        ...DEFAULT_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      socials: [],
      error: 'Failed to fetch footer configuration',
    };
  }
}

/**
 * Updates contact information and brand tagline in footer settings.
 */
export async function updateFooterSettings(
  data: AdminFooterSettingsInput
): Promise<AdminActionResponse<AdminFooterSettings>> {
  try {
    await requireAdminUser();
    let record = await db.footerSetting.findFirst();

    if (!record) {
      record = await db.footerSetting.create({
        data: {
          brandTagline: data.brandTagline || DEFAULT_SETTINGS.brandTagline,
          phone: data.phone || DEFAULT_SETTINGS.phone,
          email: data.email || DEFAULT_SETTINGS.email,
          address: data.address || DEFAULT_SETTINGS.address,
          mapUrl: data.mapUrl || DEFAULT_SETTINGS.mapUrl,
          copyrightText: data.copyrightText || DEFAULT_SETTINGS.copyrightText,
        },
      });
    } else {
      record = await db.footerSetting.update({
        where: { id: record.id },
        data: {
          brandTagline: data.brandTagline,
          phone: data.phone,
          email: data.email,
          address: data.address,
          mapUrl: data.mapUrl,
          copyrightText: data.copyrightText,
        },
      });
    }

    revalidatePath('/footer');
    return {
      success: true,
      data: {
        id: record.id,
        brandTagline: record.brandTagline,
        phone: record.phone,
        email: record.email,
        address: record.address,
        mapUrl: record.mapUrl,
        copyrightText: record.copyrightText,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[Update Footer Settings Error]:', error);
    return { success: false, error: 'Failed to save contact settings' };
  }
}

/**
 * Creates a new social account link.
 */
export async function createSocialLink(
  data: AdminSocialLinkInput
): Promise<AdminActionResponse<AdminSocialLink>> {
  try {
    await requireAdminUser();
    const count = await db.socialLink.count();
    const orderIndex = data.orderIndex !== undefined ? data.orderIndex : count;

    const created = await db.socialLink.create({
      data: {
        platform: data.platform.toLowerCase().trim(),
        name: data.name.trim(),
        url: data.url.trim(),
        icon: (data.icon || data.platform || 'globe').toLowerCase().trim(),
        active: data.active !== undefined ? data.active : true,
        orderIndex,
      },
    });

    revalidatePath('/footer');
    return {
      success: true,
      data: {
        id: created.id,
        platform: created.platform,
        name: created.name,
        url: created.url,
        icon: created.icon,
        active: created.active,
        orderIndex: created.orderIndex,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[Create Social Link Error]:', error);
    return { success: false, error: 'Failed to add social account' };
  }
}

/**
 * Updates an existing social link account.
 */
export async function updateSocialLink(
  id: string,
  data: Partial<AdminSocialLinkInput>
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const updatePayload: {
      platform?: string;
      name?: string;
      url?: string;
      icon?: string;
      active?: boolean;
      orderIndex?: number;
    } = {};
    if (data.platform !== undefined) updatePayload.platform = data.platform.toLowerCase().trim();
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.url !== undefined) updatePayload.url = data.url.trim();
    if (data.icon !== undefined) updatePayload.icon = data.icon.toLowerCase().trim();
    if (data.active !== undefined) updatePayload.active = data.active;
    if (data.orderIndex !== undefined) updatePayload.orderIndex = data.orderIndex;

    await db.socialLink.update({
      where: { id },
      data: updatePayload,
    });

    revalidatePath('/footer');
    return { success: true };
  } catch (error) {
    console.error('[Update Social Link Error]:', error);
    return { success: false, error: 'Failed to update social account' };
  }
}

/**
 * Toggles visibility (hide/unhide) of a social account.
 */
export async function toggleSocialVisibility(
  id: string,
  active: boolean
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    await db.socialLink.update({
      where: { id },
      data: { active },
    });

    revalidatePath('/footer');
    return { success: true };
  } catch (error) {
    console.error('[Toggle Social Visibility Error]:', error);
    return { success: false, error: 'Failed to toggle account visibility' };
  }
}

/**
 * Reorders a social account up or down.
 */
export async function reorderSocialLink(
  id: string,
  direction: 'up' | 'down'
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const records = await db.socialLink.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const currentIndex = records.findIndex((s) => s.id === id);
    if (currentIndex === -1) return { success: false, error: 'Social account not found' };

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= records.length) {
      return { success: true };
    }

    const currentItem = records[currentIndex];
    const targetItem = records[targetIndex];

    await db.$transaction([
      db.socialLink.update({
        where: { id: currentItem.id },
        data: { orderIndex: targetItem.orderIndex },
      }),
      db.socialLink.update({
        where: { id: targetItem.id },
        data: { orderIndex: currentItem.orderIndex },
      }),
    ]);

    revalidatePath('/footer');
    return { success: true };
  } catch (error) {
    console.error('[Reorder Social Link Error]:', error);
    return { success: false, error: 'Failed to reorder social account' };
  }
}

/**
 * Deletes a social account from the catalog.
 */
export async function deleteSocialLink(id: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    await db.socialLink.delete({
      where: { id },
    });

    revalidatePath('/footer');
    return { success: true };
  } catch (error) {
    console.error('[Delete Social Link Error]:', error);
    return { success: false, error: 'Failed to delete social account' };
  }
}
