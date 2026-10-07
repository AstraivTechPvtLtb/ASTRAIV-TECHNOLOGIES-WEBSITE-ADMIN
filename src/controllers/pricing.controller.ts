'use server';

/**
 * @file admin/src/controllers/pricing.controller.ts
 * @description [CONTROLLER] Business logic for managing engagement models and delivery structures.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import {
  AdminPricingPlan,
  AdminPricingPlanInput,
  AdminActionResponse,
  AdminPricingPageSettings,
  DEFAULT_ADMIN_PRICING_PAGE_SETTINGS,
} from '@/models/types';
import { Prisma } from '@prisma/client';
import { requireAdminUser } from './auth.controller';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Intentionally ignored when invoked outside active Next.js request context
  }
}

const DEFAULT_ENGAGEMENT_SEEDS: AdminPricingPlanInput[] = [
  {
    name: 'Fixed-Scope Project',
    slug: 'fixed-scope-project',
    description: 'For clearly defined deliverables. Scope, milestones, timeline, and quotation are agreed before development begins.',
    badge: null,
    isPopular: false,
    features: [
      'Comprehensive requirements specification & technical roadmap',
      'Fixed milestone schedule with clear deliverable acceptance criteria',
      'Dedicated technical architect & code reviews on every merge',
      'Complete intellectual property transfer upon project signoff',
      '30-day post-deployment warranty and defect resolution',
    ],
    buttonText: 'Request a Quote',
    buttonUrl: '/start-project?source_page=/pricing',
    active: true,
    orderIndex: 1,
  },
  {
    name: 'Ongoing Development',
    slug: 'ongoing-development',
    description: 'For projects that evolve over time. Priorities, development capacity, and billing terms are agreed for each engagement period.',
    badge: 'MOST POPULAR',
    isPopular: true,
    features: [
      'Agile sprint-based delivery with continuous backlog grooming',
      'Full-stack engineers, UI/UX designers, and DevOps capacity',
      'Direct asynchronous Slack / Teams collaboration & bi-weekly reviews',
      'Automated end-to-end testing & zero-downtime CI/CD deployment',
      'Flexible sprint capacity scaling with zero vendor lock-in',
    ],
    buttonText: 'Request a Quote',
    buttonUrl: '/start-project?source_page=/pricing',
    active: true,
    orderIndex: 2,
  },
  {
    name: 'Maintenance & Support',
    slug: 'maintenance-and-support',
    description: 'For maintaining an existing application. Covered systems, included work, availability, and response arrangements are defined separately.',
    badge: null,
    isPopular: false,
    features: [
      'Proactive security patching, framework upgrades & dependency audits',
      'Continuous uptime telemetry, error tracking, and performance tuning',
      'Priority defect resolution & minor operational feature enhancements',
      'Database health, backup verification, and cloud cost optimization',
      'Defined response arrangements with monthly engineering status reports',
    ],
    buttonText: 'Request a Quote',
    buttonUrl: '/start-project?source_page=/pricing',
    active: true,
    orderIndex: 3,
  },
];

/**
 * Retrieves all engagement models ordered by orderIndex.
 */
export async function getPricingPlans(): Promise<{ data: AdminPricingPlan[]; error?: string }> {
  // 1. Primary: Direct PostgreSQL via Prisma ORM
  try {
    let records = await db.pricingPlan.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    // Auto-seed initial engagement models if table is empty
    if (!records || records.length === 0) {
      try {
        for (const seed of DEFAULT_ENGAGEMENT_SEEDS) {
          await db.pricingPlan.create({
            data: {
              name: seed.name,
              slug: seed.slug || seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: seed.description,
              badge: seed.badge,
              isPopular: seed.isPopular === true,
              features: seed.features || [],
              buttonText: seed.buttonText || 'Request a Quote',
              buttonUrl: seed.buttonUrl || '/start-project?source_page=/pricing',
              active: seed.active !== false,
              orderIndex: seed.orderIndex ?? 0,
            },
          });
        }
        records = await db.pricingPlan.findMany({
          orderBy: { orderIndex: 'asc' },
        });
      } catch (seedErr) {
        console.warn('[Admin Auto-seed Engagement Models Notice]:', seedErr);
      }
    }

    if (records && records.length > 0) {
      const mapped: AdminPricingPlan[] = records.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        badge: p.badge,
        isPopular: p.isPopular,
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
          features: p.features || [],
          buttonText: p.button_text || 'Request a Quote',
          buttonUrl: p.button_url || '/start-project?source_page=/pricing',
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
 * Creates a new engagement model.
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
    const features = data.features || [];
    const active = data.active !== false;
    const buttonText = data.buttonText || 'Request a Quote';
    const buttonUrl = data.buttonUrl || '/start-project?source_page=/pricing';

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
    safeRevalidate('/en/pricing');
    safeRevalidate('/dashboard');

    if (createdPlan) {
      return { success: true, data: createdPlan };
    }

    return { success: false, error: 'Failed to create engagement model in database' };
  } catch (error) {
    console.error('[Create PricingPlan Error]:', error);
    return { success: false, error: 'Failed to create engagement model' };
  }
}

/**
 * Updates an existing engagement model.
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
    safeRevalidate('/en/pricing');
    safeRevalidate('/dashboard');

    if (updated) {
      return { success: true, message: 'Engagement model updated successfully' };
    }

    return { success: false, error: 'Could not update engagement model in database' };
  } catch (error) {
    console.error('[Update PricingPlan Error]:', error);
    return { success: false, error: 'Failed to update engagement model' };
  }
}

/**
 * Removes / deletes an engagement model.
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
      return { success: true, message: 'Engagement model removed successfully' };
    }

    return { success: false, error: 'Failed to delete engagement model' };
  } catch (error) {
    console.error('[Delete PricingPlan Error]:', error);
    return { success: false, error: 'Failed to delete engagement model' };
  }
}

/**
 * Reorders an engagement model up or down.
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
      return { success: false, error: 'Engagement model not found' };
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
    return { success: false, error: 'Failed to reorder engagement model' };
  }
}

/**
 * Toggles active/draft status of an engagement model.
 */
export async function togglePricingPlanStatus(
  id: string,
  active: boolean
): Promise<AdminActionResponse> {
  return updatePricingPlan(id, { active });
}

/**
 * Retrieves the page-level image and header settings for the Engagement Models page.
 */
export async function getPricingPageSettings(): Promise<{ data: AdminPricingPageSettings; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (db as any).pageContent.findUnique({
      where: { pageKey: 'pricing' },
    });

    if (page && page.sections) {
      const sections = typeof page.sections === 'string' ? JSON.parse(page.sections) : page.sections;
      if (sections && sections.heroImage) {
        return {
          data: {
            heroImageUrl: sections.heroImage.heroImageUrl !== undefined ? sections.heroImage.heroImageUrl : DEFAULT_ADMIN_PRICING_PAGE_SETTINGS.heroImageUrl,
            heroImageAlt: sections.heroImage.heroImageAlt || DEFAULT_ADMIN_PRICING_PAGE_SETTINGS.heroImageAlt,
            showHeroImage: sections.heroImage.showHeroImage !== false,
            imageWidth: sections.heroImage.imageWidth || DEFAULT_ADMIN_PRICING_PAGE_SETTINGS.imageWidth,
            imageHeight: sections.heroImage.imageHeight || DEFAULT_ADMIN_PRICING_PAGE_SETTINGS.imageHeight,
            imageSizeBytes: sections.heroImage.imageSizeBytes || DEFAULT_ADMIN_PRICING_PAGE_SETTINGS.imageSizeBytes,
            imageSizeLabel: sections.heroImage.imageSizeLabel || DEFAULT_ADMIN_PRICING_PAGE_SETTINGS.imageSizeLabel,
          },
        };
      }
    }

    return { data: DEFAULT_ADMIN_PRICING_PAGE_SETTINGS };
  } catch (err: unknown) {
    console.warn('[getPricingPageSettings fallback]:', (err as Error)?.message || err);
    return { data: DEFAULT_ADMIN_PRICING_PAGE_SETTINGS };
  }
}

/**
 * Updates the page-level image and header settings for the Engagement Models page.
 */
export async function updatePricingPageSettings(
  settings: AdminPricingPageSettings
): Promise<AdminActionResponse<AdminPricingPageSettings>> {
  try {
    await requireAdminUser();

    // 1. Primary: Direct PostgreSQL via Prisma ORM
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).pageContent.upsert({
        where: { pageKey: 'pricing' },
        update: {
          title: 'Engagement Models & Delivery Structures',
          sections: { heroImage: settings },
          status: 'published',
          updatedAt: new Date(),
        },
        create: {
          pageKey: 'pricing',
          title: 'Engagement Models & Delivery Structures',
          sections: { heroImage: settings },
          status: 'published',
        },
      });
    } catch (prismaErr) {
      console.warn('[updatePricingPageSettings Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Secondary: Supabase fallback
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        await supabase.from('page_contents').upsert({
          page_key: 'pricing',
          title: 'Engagement Models & Delivery Structures',
          sections: { heroImage: settings },
          status: 'published',
          updated_at: new Date().toISOString(),
        });
      } catch (supaErr) {
        console.warn('[updatePricingPageSettings Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/pricing');
    safeRevalidate('/en/pricing');
    safeRevalidate('/es/pricing');
    safeRevalidate('/hi/pricing');
    safeRevalidate('/ar/pricing');

    return { success: true, data: settings, message: 'Page image settings saved successfully' };
  } catch (error) {
    console.error('[updatePricingPageSettings Error]:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to save page image settings' };
  }
}

