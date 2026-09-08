'use server';

/**
 * @file admin/src/controllers/footer.controller.ts
 * @description [CONTROLLER] Business logic for managing client website footer details, contact info, and social networks.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import {
  AdminFooterSettings,
  AdminFooterSettingsInput,
  AdminSocialLink,
  AdminSocialLinkInput,
  AdminActionResponse,
} from '@/models/types';

const DEFAULT_FOOTER_SETTINGS: AdminFooterSettings = {
  brand_tagline: 'Your trusted partner for AI, enterprise software, and scalable cloud systems.',
  phone: '+91 8167409664',
  email: 'info@astraivtechnologies.com',
  address: 'Ashoknagar, Kolkata',
  map_url: 'https://maps.google.com/?q=Ashoknagar,+Kolkata',
  copyright_text: 'Astraiv Technologies. All rights reserved.',
};

const DEFAULT_SOCIAL_LINKS: AdminSocialLink[] = [
  {
    id: 'seed-twitter',
    platform: 'twitter',
    name: 'Twitter / X',
    url: 'https://twitter.com',
    icon: 'twitter',
    active: true,
    order_index: 0,
  },
  {
    id: 'seed-linkedin',
    platform: 'linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: 'linkedin',
    active: true,
    order_index: 1,
  },
  {
    id: 'seed-github',
    platform: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    icon: 'github',
    active: true,
    order_index: 2,
  },
];

function safeRevalidateFooter() {
  try {
    revalidatePath('/footer');
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/');
  } catch {
    // Suppress error if called outside Next.js action context
  }
}

/**
 * Retrieves footer settings including contact info, brand tagline, and copyright.
 */
export async function getFooterSettings(): Promise<{ data: AdminFooterSettings; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      try {
        const record = await db.footerSetting.findFirst();
        if (record) {
          return {
            data: {
              id: record.id,
              brand_tagline: record.brandTagline,
              phone: record.phone,
              email: record.email,
              address: record.address,
              map_url: record.mapUrl || DEFAULT_FOOTER_SETTINGS.map_url,
              copyright_text: record.copyrightText || DEFAULT_FOOTER_SETTINGS.copyright_text,
              updated_at: record.updatedAt.toISOString(),
            },
          };
        }
      } catch (dbErr) {
        console.warn('[Get Footer Settings DB Fallback]:', dbErr);
      }
      return { data: DEFAULT_FOOTER_SETTINGS };
    }

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('footer_settings').select('*').limit(1).maybeSingle();

    if (error || !data) {
      return { data: DEFAULT_FOOTER_SETTINGS };
    }

    return {
      data: {
        id: data.id,
        brand_tagline: data.brand_tagline || DEFAULT_FOOTER_SETTINGS.brand_tagline,
        phone: data.phone || DEFAULT_FOOTER_SETTINGS.phone,
        email: data.email || DEFAULT_FOOTER_SETTINGS.email,
        address: data.address || DEFAULT_FOOTER_SETTINGS.address,
        map_url: data.map_url || DEFAULT_FOOTER_SETTINGS.map_url,
        copyright_text: data.copyright_text || DEFAULT_FOOTER_SETTINGS.copyright_text,
        updated_at: data.updated_at,
      },
    };
  } catch (error) {
    console.error('[Get Footer Settings Error]:', error);
    return { data: DEFAULT_FOOTER_SETTINGS, error: 'Failed to fetch footer settings' };
  }
}

/**
 * Updates company contact details and footer settings.
 */
export async function updateFooterSettings(
  data: AdminFooterSettingsInput
): Promise<AdminActionResponse<AdminFooterSettings>> {
  try {
    const payload = {
      brandTagline: data.brand_tagline.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      mapUrl: data.map_url?.trim() || `https://maps.google.com/?q=${encodeURIComponent(data.address.trim())}`,
      copyrightText: data.copyright_text?.trim() || 'Astraiv Technologies. All rights reserved.',
    };

    if (!isSupabaseConfigured()) {
      try {
        const existing = await db.footerSetting.findFirst();
        let updated;
        if (existing) {
          updated = await db.footerSetting.update({
            where: { id: existing.id },
            data: payload,
          });
        } else {
          updated = await db.footerSetting.create({
            data: payload,
          });
        }

        safeRevalidateFooter();
        return {
          success: true,
          data: {
            id: updated.id,
            brand_tagline: updated.brandTagline,
            phone: updated.phone,
            email: updated.email,
            address: updated.address,
            map_url: updated.mapUrl,
            copyright_text: updated.copyrightText,
            updated_at: updated.updatedAt.toISOString(),
          },
          message: 'Footer contact settings updated successfully',
        };
      } catch (dbErr: any) {
        console.error('[Update Footer Settings DB Error]:', dbErr);
        return { success: false, error: dbErr?.message || 'Failed to update database' };
      }
    }

    const supabase = await createSupabaseClient();
    const { data: existing } = await supabase.from('footer_settings').select('id').limit(1).maybeSingle();

    const dbPayload = {
      brand_tagline: payload.brandTagline,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      map_url: payload.mapUrl,
      copyright_text: payload.copyrightText,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing?.id) {
      const { data: updated, error } = await supabase
        .from('footer_settings')
        .update(dbPayload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from('footer_settings')
        .insert(dbPayload)
        .select()
        .single();
      if (error) throw error;
      result = inserted;
    }

    safeRevalidateFooter();
    return {
      success: true,
      data: {
        id: result.id,
        brand_tagline: result.brand_tagline,
        phone: result.phone,
        email: result.email,
        address: result.address,
        map_url: result.map_url,
        copyright_text: result.copyright_text,
        updated_at: result.updated_at,
      },
      message: 'Footer contact settings updated successfully',
    };
  } catch (error: any) {
    console.error('[Update Footer Settings Error]:', error);
    return { success: false, error: error?.message || 'Failed to update footer settings' };
  }
}

/**
 * Retrieves all configured social links ordered by display index.
 */
export async function getSocialLinks(): Promise<{ data: AdminSocialLink[]; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      try {
        const records = await db.socialLink.findMany({
          orderBy: { orderIndex: 'asc' },
        });

        if (records.length === 0) {
          return { data: DEFAULT_SOCIAL_LINKS };
        }

        const mapped: AdminSocialLink[] = records.map((s) => ({
          id: s.id,
          platform: s.platform,
          name: s.name,
          url: s.url,
          icon: s.icon,
          active: s.active,
          order_index: s.orderIndex,
          created_at: s.createdAt.toISOString(),
          updated_at: s.updatedAt.toISOString(),
        }));

        return { data: mapped };
      } catch (dbErr) {
        console.warn('[Get Social Links DB Fallback]:', dbErr);
        return { data: DEFAULT_SOCIAL_LINKS };
      }
    }

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return { data: DEFAULT_SOCIAL_LINKS };
    }

    const mapped: AdminSocialLink[] = data.map((s: any) => ({
      id: s.id,
      platform: s.platform,
      name: s.name,
      url: s.url,
      icon: s.icon || s.platform,
      active: s.active ?? true,
      order_index: s.order_index ?? 0,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    return { data: mapped };
  } catch (error) {
    console.error('[Get Social Links Error]:', error);
    return { data: DEFAULT_SOCIAL_LINKS, error: 'Failed to fetch social links' };
  }
}

/**
 * Creates a new social link record.
 */
export async function createSocialLink(
  data: AdminSocialLinkInput
): Promise<AdminActionResponse<AdminSocialLink>> {
  try {
    const platform = data.platform.toLowerCase().trim();
    const name = data.name.trim() || data.platform;
    const url = data.url.trim();
    const icon = (data.icon || platform).toLowerCase().trim();
    const active = data.active ?? true;
    const orderIndex = data.order_index ?? 0;

    if (!isSupabaseConfigured()) {
      const created = await db.socialLink.create({
        data: {
          platform,
          name,
          url,
          icon,
          active,
          orderIndex,
        },
      });

      safeRevalidateFooter();
      return {
        success: true,
        data: {
          id: created.id,
          platform: created.platform,
          name: created.name,
          url: created.url,
          icon: created.icon,
          active: created.active,
          order_index: created.orderIndex,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
        },
        message: `Social link "${name}" added successfully`,
      };
    }

    const supabase = await createSupabaseClient();
    const { data: created, error } = await supabase
      .from('social_links')
      .insert({
        platform,
        name,
        url,
        icon,
        active,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (error) throw error;
    safeRevalidateFooter();
    return {
      success: true,
      data: {
        id: created.id,
        platform: created.platform,
        name: created.name,
        url: created.url,
        icon: created.icon,
        active: created.active,
        order_index: created.order_index,
        created_at: created.created_at,
        updated_at: created.updated_at,
      },
      message: `Social link "${name}" added successfully`,
    };
  } catch (error: any) {
    console.error('[Create Social Link Error]:', error);
    return { success: false, error: error?.message || 'Failed to create social link' };
  }
}

/**
 * Updates an existing social link record.
 */
export async function updateSocialLink(
  id: string,
  data: Partial<AdminSocialLinkInput>
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      const updatePayload: any = {};
      if (data.platform !== undefined) updatePayload.platform = data.platform.toLowerCase().trim();
      if (data.name !== undefined) updatePayload.name = data.name.trim();
      if (data.url !== undefined) updatePayload.url = data.url.trim();
      if (data.icon !== undefined) updatePayload.icon = data.icon.toLowerCase().trim();
      if (data.active !== undefined) updatePayload.active = data.active;
      if (data.order_index !== undefined) updatePayload.orderIndex = data.order_index;

      await db.socialLink.update({
        where: { id },
        data: updatePayload,
      });

      safeRevalidateFooter();
      return { success: true, message: 'Social link updated successfully' };
    }

    const supabase = await createSupabaseClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.platform !== undefined) updatePayload.platform = data.platform.toLowerCase().trim();
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.url !== undefined) updatePayload.url = data.url.trim();
    if (data.icon !== undefined) updatePayload.icon = data.icon.toLowerCase().trim();
    if (data.active !== undefined) updatePayload.active = data.active;
    if (data.order_index !== undefined) updatePayload.order_index = data.order_index;

    const { error } = await supabase.from('social_links').update(updatePayload).eq('id', id);

    if (error) throw error;
    safeRevalidateFooter();
    return { success: true, message: 'Social link updated successfully' };
  } catch (error: any) {
    console.error('[Update Social Link Error]:', error);
    return { success: false, error: error?.message || 'Failed to update social link' };
  }
}

/**
 * Quick toggle for active/visible state.
 */
export async function toggleSocialStatus(id: string, active: boolean): Promise<AdminActionResponse> {
  return updateSocialLink(id, { active });
}

/**
 * Swaps or updates order between two social links.
 */
export async function swapSocialOrder(
  id1: string,
  order1: number,
  id2: string,
  order2: number
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.$transaction([
        db.socialLink.update({
          where: { id: id1 },
          data: { orderIndex: order2 },
        }),
        db.socialLink.update({
          where: { id: id2 },
          data: { orderIndex: order1 },
        }),
      ]);

      safeRevalidateFooter();
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    await supabase.from('social_links').update({ order_index: order2 }).eq('id', id1);
    await supabase.from('social_links').update({ order_index: order1 }).eq('id', id2);

    safeRevalidateFooter();
    return { success: true };
  } catch (error: any) {
    console.error('[Swap Social Order Error]:', error);
    return { success: false, error: error?.message || 'Failed to update order' };
  }
}

/**
 * Deletes a social link record.
 */
export async function deleteSocialLink(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.socialLink.delete({
        where: { id },
      });
      safeRevalidateFooter();
      return { success: true, message: 'Social link removed successfully' };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('social_links').delete().eq('id', id);

    if (error) throw error;
    safeRevalidateFooter();
    return { success: true, message: 'Social link removed successfully' };
  } catch (error: any) {
    console.error('[Delete Social Link Error]:', error);
    return { success: false, error: error?.message || 'Failed to delete social link' };
  }
}
