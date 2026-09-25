'use server';

/**
 * @file admin/src/controllers/pricing.controller.ts
 * @description [CONTROLLER] Business logic for managing pricing tiers, engagement models, and amounts.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminPricingPlan, AdminPricingPlanInput, AdminActionResponse } from '@/models/types';
import { Prisma } from '@prisma/client';
import { requireAdminUser } from './auth.controller';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Intentionally ignored when invoked outside active Next.js request context
  }
}

/**
 * Retrieves all pricing plans ordered by orderIndex.
 */
export async function getPricingPlans(): Promise<{ data: AdminPricingPlan[]; error?: string }> {
  // 1. Primary: Direct PostgreSQL via Prisma ORM
  try {
    const records = await db.pricingPlan.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    if (records && records.length > 0) {
      const mapped: AdminPricingPlan[] = records.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        badge: p.badge,
        isPopular: p.isPopular,
        priceType: (p.priceType === 'custom' ? 'custom' : 'fixed') as 'fixed' | 'custom',
        priceMonthlyInr: p.priceMonthlyInr,
        priceYearlyInr: p.priceYearlyInr,
        priceMonthlyUsd: p.priceMonthlyUsd,
        priceYearlyUsd: p.priceYearlyUsd,
        customPriceLabel: p.customPriceLabel,
        features: p.features,
        buttonText: p.buttonText,
        buttonUrl: p.buttonUrl,
        active: p.active,
        orderIndex: p.orderIndex,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));

      return { data: mapped };
    }
  } catch (prismaErr) {
    console.warn('[Admin Pricing Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
  }

  // 2. Secondary: Supabase client fallback
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseClient();
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        interface SupabasePlanRow {
          id: string;
          name: string;
          slug: string;
          description: string;
          badge?: string | null;
          is_popular?: boolean;
          price_type?: string;
          price_monthly_inr?: number | null;
          price_yearly_inr?: number | null;
          price_monthly_usd?: number | null;
          price_yearly_usd?: number | null;
          custom_price_label?: string | null;
          features?: string[];
          button_text?: string;
          button_url?: string;
          active?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        }

        const mapped: AdminPricingPlan[] = ((data as unknown as SupabasePlanRow[]) || []).map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description || '',
          badge: p.badge || null,
          isPopular: p.is_popular === true,
          priceType: (p.price_type === 'custom' ? 'custom' : 'fixed') as 'fixed' | 'custom',
          priceMonthlyInr: p.price_monthly_inr !== undefined ? p.price_monthly_inr : null,
          priceYearlyInr: p.price_yearly_inr !== undefined ? p.price_yearly_inr : null,
          priceMonthlyUsd: p.price_monthly_usd !== undefined ? p.price_monthly_usd : null,
          priceYearlyUsd: p.price_yearly_usd !== undefined ? p.price_yearly_usd : null,
          customPriceLabel: p.custom_price_label || 'Custom',
          features: p.features || [],
          buttonText: p.button_text || 'Start Building',
          buttonUrl: p.button_url || '/contact',
          active: p.active !== false,
          orderIndex: p.order_index ?? 0,
          createdAt: p.created_at || new Date().toISOString(),
          updatedAt: p.updated_at || new Date().toISOString(),
        }));

        return { data: mapped };
      }
      if (error) {
        console.warn('[Admin Supabase Pricing Notice]:', error.message);
      }
    } catch (supaErr) {
      console.warn('[Admin Supabase Pricing Error]:', (supaErr as Error)?.message || supaErr);
    }
  }

  return { data: [] };
}

/**
 * Creates a new pricing plan.
 */
export async function createPricingPlan(
  data: AdminPricingPlanInput
): Promise<AdminActionResponse<AdminPricingPlan>> {
  try {
    await requireAdminUser();
    const rawSlug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = rawSlug || `plan-${Date.now()}`;
    try {
      const existing = await db.pricingPlan.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    } catch {}
    const orderIndex = data.orderIndex ?? 0;
    const isPopular = data.isPopular === true;
    const priceType = data.priceType === 'custom' ? 'custom' : 'fixed';
    const features = data.features || [];
    const active = data.active !== false;
    const buttonText = data.buttonText || 'Start Building';
    const buttonUrl = data.buttonUrl || '/contact';

    let createdPlan: AdminPricingPlan | null = null;

    // 1. Write via Prisma
    try {
      const created = await db.pricingPlan.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          badge: data.badge || (isPopular ? 'MOST POPULAR' : null),
          isPopular,
          priceType,
          priceMonthlyInr: priceType === 'fixed' ? (data.priceMonthlyInr ?? null) : null,
          priceYearlyInr: priceType === 'fixed' ? (data.priceYearlyInr ?? null) : null,
          priceMonthlyUsd: priceType === 'fixed' ? (data.priceMonthlyUsd ?? null) : null,
          priceYearlyUsd: priceType === 'fixed' ? (data.priceYearlyUsd ?? null) : null,
          customPriceLabel: priceType === 'custom' ? (data.customPriceLabel || 'Custom') : null,
          features,
          buttonText,
          buttonUrl,
          active,
          orderIndex,
        },
      });

      createdPlan = {
        id: created.id,
        name: created.name,
        slug: created.slug,
        description: created.description,
        badge: created.badge,
        isPopular: created.isPopular,
        priceType: created.priceType as 'fixed' | 'custom',
        priceMonthlyInr: created.priceMonthlyInr,
        priceYearlyInr: created.priceYearlyInr,
        priceMonthlyUsd: created.priceMonthlyUsd,
        priceYearlyUsd: created.priceYearlyUsd,
        customPriceLabel: created.customPriceLabel,
        features: created.features,
        buttonText: created.buttonText,
        buttonUrl: created.buttonUrl,
        active: created.active,
        orderIndex: created.orderIndex,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (prismaErr) {
      console.warn('[Admin Create PricingPlan Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Also write to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const payload: Record<string, unknown> = {
          name: data.name,
          slug,
          description: data.description,
          badge: data.badge || (isPopular ? 'MOST POPULAR' : null),
          is_popular: isPopular,
          price_type: priceType,
          price_monthly_inr: priceType === 'fixed' ? (data.priceMonthlyInr ?? null) : null,
          price_yearly_inr: priceType === 'fixed' ? (data.priceYearlyInr ?? null) : null,
          price_monthly_usd: priceType === 'fixed' ? (data.priceMonthlyUsd ?? null) : null,
          price_yearly_usd: priceType === 'fixed' ? (data.priceYearlyUsd ?? null) : null,
          custom_price_label: priceType === 'custom' ? (data.customPriceLabel || 'Custom') : null,
          features,
          button_text: buttonText,
          button_url: buttonUrl,
          active,
          order_index: orderIndex,
        };
        if (createdPlan?.id) {
          payload.id = createdPlan.id;
        }

        const { data: supaCreated, error } = await supabase
          .from('pricing_plans')
          .upsert(payload)
          .select()
          .single();

        if (!error && supaCreated && !createdPlan) {
          createdPlan = {
            id: supaCreated.id,
            name: supaCreated.name,
            slug: supaCreated.slug,
            description: supaCreated.description,
            badge: supaCreated.badge,
            isPopular: supaCreated.is_popular,
            priceType: supaCreated.price_type as 'fixed' | 'custom',
            priceMonthlyInr: supaCreated.price_monthly_inr,
            priceYearlyInr: supaCreated.price_yearly_inr,
            priceMonthlyUsd: supaCreated.price_monthly_usd,
            priceYearlyUsd: supaCreated.price_yearly_usd,
            customPriceLabel: supaCreated.custom_price_label,
            features: supaCreated.features || [],
            buttonText: supaCreated.button_text,
            buttonUrl: supaCreated.button_url,
            active: supaCreated.active,
            orderIndex: supaCreated.order_index,
            createdAt: supaCreated.created_at,
            updatedAt: supaCreated.updated_at,
          };
        }
      } catch (supaErr) {
        console.warn('[Admin Create PricingPlan Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/pricing');
    safeRevalidate('/dashboard');

    if (createdPlan) {
      return { success: true, data: createdPlan };
    }

    return { success: false, error: 'Failed to create pricing plan in database' };
  } catch (error) {
    console.error('[Create PricingPlan Error]:', error);
    return { success: false, error: 'Failed to create pricing plan' };
  }
}

/**
 * Updates an existing pricing plan.
 */
export async function updatePricingPlan(
  id: string,
  data: Partial<AdminPricingPlanInput>
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    let updated = false;

    // 1. Update via Prisma
    try {
      const updateData: Prisma.PricingPlanUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.badge !== undefined) updateData.badge = data.badge;
      if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
      if (data.priceType !== undefined) updateData.priceType = data.priceType;
      if (data.priceMonthlyInr !== undefined) updateData.priceMonthlyInr = data.priceMonthlyInr;
      if (data.priceYearlyInr !== undefined) updateData.priceYearlyInr = data.priceYearlyInr;
      if (data.priceMonthlyUsd !== undefined) updateData.priceMonthlyUsd = data.priceMonthlyUsd;
      if (data.priceYearlyUsd !== undefined) updateData.priceYearlyUsd = data.priceYearlyUsd;
      if (data.customPriceLabel !== undefined) updateData.customPriceLabel = data.customPriceLabel;
      if (data.features !== undefined) updateData.features = data.features;
      if (data.buttonText !== undefined) updateData.buttonText = data.buttonText;
      if (data.buttonUrl !== undefined) updateData.buttonUrl = data.buttonUrl;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

      await db.pricingPlan.update({
        where: { id },
        data: updateData,
      });
      updated = true;
    } catch (prismaErr) {
      console.warn('[Admin Update PricingPlan Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Also update via Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const payload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (data.name !== undefined) payload.name = data.name;
        if (data.slug !== undefined) payload.slug = data.slug;
        if (data.description !== undefined) payload.description = data.description;
        if (data.badge !== undefined) payload.badge = data.badge;
        if (data.isPopular !== undefined) payload.is_popular = data.isPopular;
        if (data.priceType !== undefined) payload.price_type = data.priceType;
        if (data.priceMonthlyInr !== undefined) payload.price_monthly_inr = data.priceMonthlyInr;
        if (data.priceYearlyInr !== undefined) payload.price_yearly_inr = data.priceYearlyInr;
        if (data.priceMonthlyUsd !== undefined) payload.price_monthly_usd = data.priceMonthlyUsd;
        if (data.priceYearlyUsd !== undefined) payload.price_yearly_usd = data.priceYearlyUsd;
        if (data.customPriceLabel !== undefined) payload.custom_price_label = data.customPriceLabel;
        if (data.features !== undefined) payload.features = data.features;
        if (data.buttonText !== undefined) payload.button_text = data.buttonText;
        if (data.buttonUrl !== undefined) payload.button_url = data.buttonUrl;
        if (data.active !== undefined) payload.active = data.active;
        if (data.orderIndex !== undefined) payload.order_index = data.orderIndex;

        const { error } = await supabase.from('pricing_plans').update(payload).eq('id', id);
        if (!error) updated = true;
      } catch (supaErr) {
        console.warn('[Admin Update PricingPlan Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/pricing');
    safeRevalidate('/dashboard');

    if (updated) {
      return { success: true, message: 'Pricing plan updated successfully' };
    }

    return { success: false, error: 'Could not update pricing plan in database' };
  } catch (error) {
    console.error('[Update PricingPlan Error]:', error);
    return { success: false, error: 'Failed to update pricing plan' };
  }
}

/**
 * Removes / deletes a pricing plan.
 */
export async function deletePricingPlan(id: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    let deleted = false;

    // 1. Prisma delete
    try {
      await db.pricingPlan.delete({ where: { id } });
      deleted = true;
    } catch (prismaErr) {
      console.warn('[Admin Delete PricingPlan Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Supabase delete
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const { error } = await supabase.from('pricing_plans').delete().eq('id', id);
        if (!error) deleted = true;
      } catch (supaErr) {
        console.warn('[Admin Delete PricingPlan Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/pricing');
    safeRevalidate('/dashboard');

    if (deleted) {
      return { success: true, message: 'Pricing plan removed successfully' };
    }

    return { success: false, error: 'Failed to delete pricing plan' };
  } catch (error) {
    console.error('[Delete PricingPlan Error]:', error);
    return { success: false, error: 'Failed to delete pricing plan' };
  }
}

/**
 * Reorders a pricing plan up or down.
 */
export async function reorderPricingPlan(
  id: string,
  direction: 'up' | 'down'
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const plans = await db.pricingPlan.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const currentIndex = plans.findIndex((p) => p.id === id);
    if (currentIndex === -1) {
      return { success: false, error: 'Pricing plan not found' };
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= plans.length) {
      return { success: true, message: 'Already at extreme position' };
    }

    const currentPlan = plans[currentIndex];
    const targetPlan = plans[targetIndex];

    const currentOrder = currentPlan.orderIndex;
    const targetOrder = targetPlan.orderIndex;

    const newCurrentOrder = currentOrder === targetOrder ? (direction === 'up' ? targetOrder - 1 : targetOrder + 1) : targetOrder;
    const newTargetOrder = currentOrder;

    await db.$transaction([
      db.pricingPlan.update({
        where: { id: currentPlan.id },
        data: { orderIndex: newCurrentOrder },
      }),
      db.pricingPlan.update({
        where: { id: targetPlan.id },
        data: { orderIndex: newTargetOrder },
      }),
    ]);

    safeRevalidate('/pricing');
    return { success: true, message: 'Order updated successfully' };
  } catch (error) {
    console.error('[Reorder PricingPlan Error]:', error);
    return { success: false, error: 'Failed to reorder pricing plan' };
  }
}

/**
 * Toggles active/draft status of a pricing plan.
 */
export async function togglePricingPlanStatus(
  id: string,
  active: boolean
): Promise<AdminActionResponse> {
  return updatePricingPlan(id, { active });
}
