'use server';

/**
 * @file admin/src/controllers/recruitment.controller.ts
 * @description [CONTROLLER] Business logic for managing career openings, canonical categories, applications, page content, and shared defaults.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import {
  AdminJobOpening,
  AdminJobOpeningInput,
  AdminJobApplication,
  JobCategory,
  JobCategoryInput,
  CareersPageContentData,
  SharedCareersDefaultsData,
  AdminActionResponse,
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

// ==========================================
// DEFAULT CANONICAL PAGE & SHARED DEFAULTS
// ==========================================

const DEFAULT_CAREERS_PAGE_CONTENT: CareersPageContentData = {
  heroHeading: 'Work With Architects,\nNot Bureaucrats.',
  heroSubtitle:
    'We are a team of senior software engineers, cloud architects, and AI researchers building mission-critical platforms for high-growth enterprises worldwide.',
  cultureCards: [
    {
      title: 'Architectural Ownership',
      body: 'We do not micromanage tickets. Engineers own architecture end-to-end, from schema definition to multi-region cloud deployment.',
      icon: 'Compass',
      order: 1,
      active: true,
    },
    {
      title: 'Async Deep Work Culture',
      body: 'We minimize synchronous meetings in favor of precise technical specs, RFC documents, and uninterrupted focus time.',
      icon: 'Users',
      order: 2,
      active: true,
    },
    {
      title: 'Radical Engineering Candor',
      body: 'Code reviews are honest, rigorous, and ego-free. We care deeply about clean code, memory safety, and performance budgets.',
      icon: 'HeartHandshake',
      order: 3,
      active: true,
    },
  ],
  careersImage: {
    enabled: false,
    imageUrl: '',
    altText: 'Astraiv Technologies engineering architects collaborating on high-scale cloud infrastructure',
    focalPoint: 'center',
    width: 1600,
    height: 900,
    sizeBytes: 0,
    sizeLabel: '',
  },
  benefitsHeading: 'Build the Future with [Elite Engineers]',
  benefitsSubtitle:
    'Join our team of elite full-stack engineers and architects solving high-stakes enterprise challenges.',
  benefitsCards: [
    {
      title: '100% Remote & Global Autonomy',
      body: 'Work from wherever you are most productive. We value high output and clean deliverables over seat-time.',
      icon: 'Globe2',
      order: 1,
      active: true,
    },
    {
      title: 'Modern Architecture Only',
      body: 'Zero legacy debt. We build exclusively with Next.js 16, React 19, TypeScript, Rust, Python, and edge runtimes.',
      icon: 'Code2',
      order: 2,
      active: true,
    },
    {
      title: 'AI & Cognitive Engineering',
      body: 'Direct hands-on experience building autonomous agents, multi-tenant RAG systems, and enterprise LLM pipelines.',
      icon: 'Brain',
      order: 3,
      active: true,
    },
    {
      title: 'Competitive Compensation',
      body: 'Top-tier global market rates, milestone sprint bonuses, and accelerated career growth into staff architectural roles.',
      icon: 'ShieldCheck',
      order: 4,
      active: true,
    },
  ],
  opportunitiesHeading: 'Current Open Opportunities',
  opportunitiesSubtitle:
    'Direct applications reviewed within 48 business hours by our engineering founders.',
  searchPlaceholder: 'Search skills, title...',
  emptyStateCopy:
    'No active openings match your current search or filter. Clear the filter or submit a speculative application below.',
  speculativeCta: {
    enabled: true,
    kicker: 'Unsolicited & Speculative Applications',
    title: "Don't See Your Exact Specialty Listed?",
    body: 'If you are a world-class systems engineer, compiler enthusiast, or AI infrastructure architect, we always make room for exceptional talent.',
    buttonText: 'Send Speculative Application',
    buttonUrl: '/contact?role=Speculative%20Senior%20Architect',
  },
  speculativePageCopy: {
    heading: 'Speculative Engineering Application',
    subheading: 'Tell us how you build, what architectures you love, and where you excel.',
    supportGuidance:
      'We review unsolicited applications directly by our technical founders. Freshers with strong projects and senior architects are welcome.',
    successMessage:
      'Your speculative application has been received. Our engineering leadership will review your profile within 48 business hours.',
  },
};

const DEFAULT_SHARED_CAREERS_DEFAULTS: SharedCareersDefaultsData = {
  interviewStages: [
    {
      num: '01',
      title: 'Profile & Architecture Review',
      desc: 'Our senior architects review your GitHub, past system implementations, and RFCs within 48 business hours.',
    },
    {
      num: '02',
      title: 'Technical & Systems Discussion',
      desc: 'A 45-minute deep-dive with our engineering founders into real-world architecture trade-offs, concurrency, and reliability.',
    },
    {
      num: '03',
      title: 'Practical System Design Exercise',
      desc: 'A scoped, paid system design discussion or take-home RFC tailored to your specialty. No inverted binary trees on whiteboards.',
    },
    {
      num: '04',
      title: 'Mutual Offer & Onboarding',
      desc: 'Transparent compensation offer, equity allocation, home workstation budget setup, and seamless async onboarding.',
    },
  ],
  commonBenefits: [
    '100% remote work autonomy with flexible hours and no micromanagement.',
    'Top-of-market base compensation plus meaningful equity participation.',
    '$3,500 home office & latest Apple hardware stipend upon joining.',
    'Annual $2,000 continuous learning & technical conference budget.',
    'Comprehensive health coverage & generous paid time off.',
  ],
  defaultReferralBonus: '$2,500',
  defaultPrivacyText:
    'By submitting, your data is processed strictly under our NDA protocols and privacy policy. No unsolicited third-party disclosure.',
};

// ==========================================
// 1. PAGE CONTENT & SHARED DEFAULTS
// ==========================================

export async function getCareersPageContent(): Promise<{
  data: CareersPageContentData;
  sharedDefaults: SharedCareersDefaultsData;
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (db as any).pageContent.findUnique({
      where: { pageKey: 'careers' },
    });

    if (page && page.sections) {
      const sections = typeof page.sections === 'string' ? JSON.parse(page.sections) : page.sections;

      // 1. Hero Heading & Subtitle
      let heroHeading = DEFAULT_CAREERS_PAGE_CONTENT.heroHeading;
      if (typeof sections.heroHeading === 'string' && sections.heroHeading.trim()) {
        heroHeading = sections.heroHeading;
      } else if (sections.hero && typeof sections.hero === 'object') {
        const hText = sections.hero.heading || 'Work With Architects,';
        const hHighlight = sections.hero.highlightText || 'Not Bureaucrats.';
        heroHeading = `${hText}\n${hHighlight}`;
      }

      let heroSubtitle = DEFAULT_CAREERS_PAGE_CONTENT.heroSubtitle;
      if (typeof sections.heroSubtitle === 'string' && sections.heroSubtitle.trim()) {
        heroSubtitle = sections.heroSubtitle;
      } else if (sections.hero && typeof sections.hero.subtitle === 'string') {
        heroSubtitle = sections.hero.subtitle;
      }

      // 2. Benefits Heading & Subtitle
      let benefitsHeading = DEFAULT_CAREERS_PAGE_CONTENT.benefitsHeading;
      let benefitsSubtitle = DEFAULT_CAREERS_PAGE_CONTENT.benefitsSubtitle;

      if (typeof sections.benefitsHeading === 'string' && sections.benefitsHeading.trim()) {
        benefitsHeading = sections.benefitsHeading;
      } else if (sections.benefitsHeading && typeof sections.benefitsHeading === 'object') {
        const bTitle = sections.benefitsHeading.title || 'Build the Future with';
        const bHighlight = sections.benefitsHeading.highlightText || 'Elite Engineers';
        benefitsHeading = bHighlight ? `${bTitle} [${bHighlight}]` : bTitle;
        if (typeof sections.benefitsHeading.subtitle === 'string') {
          benefitsSubtitle = sections.benefitsHeading.subtitle;
        }
      }

      if (typeof sections.benefitsSubtitle === 'string' && sections.benefitsSubtitle.trim()) {
        benefitsSubtitle = sections.benefitsSubtitle;
      }

      // 3. Culture Cards
      let cultureCards = DEFAULT_CAREERS_PAGE_CONTENT.cultureCards;
      if (Array.isArray(sections.cultureCards) && sections.cultureCards.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cultureCards = sections.cultureCards.map((c: any, i: number) => ({
          title: typeof c.title === 'string' ? c.title : `Culture Value ${i + 1}`,
          body: typeof c.body === 'string' ? c.body : '',
          icon: typeof c.icon === 'string' ? c.icon : 'Sparkles',
          order: c.order !== undefined ? Number(c.order) : c.orderIndex !== undefined ? Number(c.orderIndex) : i + 1,
          active: c.active !== undefined ? Boolean(c.active) : c.visible !== undefined ? Boolean(c.visible) : true,
        }));
      }

      // 4. Careers Image
      const imgObj = sections.careersImage || {};
      const careersImage = {
        enabled: imgObj.enabled !== undefined ? Boolean(imgObj.enabled) : imgObj.visible !== undefined ? Boolean(imgObj.visible) : false,
        imageUrl: typeof imgObj.imageUrl === 'string' ? imgObj.imageUrl : typeof imgObj.url === 'string' ? imgObj.url : '',
        altText: typeof imgObj.altText === 'string' ? imgObj.altText : typeof imgObj.alt === 'string' ? imgObj.alt : DEFAULT_CAREERS_PAGE_CONTENT.careersImage.altText,
        focalPoint: typeof imgObj.focalPoint === 'string' ? imgObj.focalPoint : 'center',
        width: typeof imgObj.width === 'number' ? imgObj.width : 1600,
        height: typeof imgObj.height === 'number' ? imgObj.height : 900,
        sizeBytes: typeof imgObj.sizeBytes === 'number' ? imgObj.sizeBytes : 0,
        sizeLabel: typeof imgObj.sizeLabel === 'string' ? imgObj.sizeLabel : '',
      };

      // 5. Benefits Cards
      let benefitsCards = DEFAULT_CAREERS_PAGE_CONTENT.benefitsCards;
      if (Array.isArray(sections.benefitsCards) && sections.benefitsCards.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        benefitsCards = sections.benefitsCards.map((b: any, i: number) => ({
          title: typeof b.title === 'string' ? b.title : `Benefit ${i + 1}`,
          body: typeof b.body === 'string' ? b.body : '',
          icon: typeof b.icon === 'string' ? b.icon : 'ShieldCheck',
          order: b.order !== undefined ? Number(b.order) : b.orderIndex !== undefined ? Number(b.orderIndex) : i + 1,
          active: b.active !== undefined ? Boolean(b.active) : b.visible !== undefined ? Boolean(b.visible) : true,
        }));
      }

      // 6. Opportunities
      const oppObj = sections.opportunities || {};
      const opportunitiesHeading = typeof sections.opportunitiesHeading === 'string' && sections.opportunitiesHeading.trim()
        ? sections.opportunitiesHeading
        : typeof oppObj.heading === 'string' && oppObj.heading.trim()
        ? oppObj.heading
        : DEFAULT_CAREERS_PAGE_CONTENT.opportunitiesHeading;

      const opportunitiesSubtitle = typeof sections.opportunitiesSubtitle === 'string' && sections.opportunitiesSubtitle.trim()
        ? sections.opportunitiesSubtitle
        : typeof oppObj.supportingText === 'string' && oppObj.supportingText.trim()
        ? oppObj.supportingText
        : DEFAULT_CAREERS_PAGE_CONTENT.opportunitiesSubtitle;

      const searchPlaceholder = typeof sections.searchPlaceholder === 'string' && sections.searchPlaceholder.trim()
        ? sections.searchPlaceholder
        : typeof oppObj.searchPlaceholder === 'string' && oppObj.searchPlaceholder.trim()
        ? oppObj.searchPlaceholder
        : DEFAULT_CAREERS_PAGE_CONTENT.searchPlaceholder;

      const emptyStateCopy = typeof sections.emptyStateCopy === 'string' && sections.emptyStateCopy.trim()
        ? sections.emptyStateCopy
        : typeof oppObj.emptyStateText === 'string' && oppObj.emptyStateText.trim()
        ? oppObj.emptyStateText
        : DEFAULT_CAREERS_PAGE_CONTENT.emptyStateCopy;

      // 7. Speculative CTA
      const specCtaObj = sections.speculativeCta || {};
      const speculativeCta = {
        enabled: specCtaObj.enabled !== undefined ? Boolean(specCtaObj.enabled) : specCtaObj.visible !== undefined ? Boolean(specCtaObj.visible) : true,
        kicker: typeof specCtaObj.kicker === 'string' ? specCtaObj.kicker : 'Unsolicited & Speculative Applications',
        title: typeof specCtaObj.title === 'string' ? specCtaObj.title : typeof specCtaObj.heading === 'string' ? specCtaObj.heading : DEFAULT_CAREERS_PAGE_CONTENT.speculativeCta.title,
        body: typeof specCtaObj.body === 'string' ? specCtaObj.body : DEFAULT_CAREERS_PAGE_CONTENT.speculativeCta.body,
        buttonText: typeof specCtaObj.buttonText === 'string' ? specCtaObj.buttonText : DEFAULT_CAREERS_PAGE_CONTENT.speculativeCta.buttonText,
        buttonUrl: typeof specCtaObj.buttonUrl === 'string' ? specCtaObj.buttonUrl : DEFAULT_CAREERS_PAGE_CONTENT.speculativeCta.buttonUrl,
      };

      // 8. Speculative Page Copy
      const specPageObj = sections.speculativePageCopy || sections.speculativePage || {};
      const speculativePageCopy = {
        heading: typeof specPageObj.heading === 'string' ? specPageObj.heading : DEFAULT_CAREERS_PAGE_CONTENT.speculativePageCopy.heading,
        subheading: typeof specPageObj.subheading === 'string' ? specPageObj.subheading : typeof specPageObj.subtitle === 'string' ? specPageObj.subtitle : DEFAULT_CAREERS_PAGE_CONTENT.speculativePageCopy.subheading,
        supportGuidance: typeof specPageObj.supportGuidance === 'string' ? specPageObj.supportGuidance : typeof specPageObj.noticeText === 'string' ? specPageObj.noticeText : DEFAULT_CAREERS_PAGE_CONTENT.speculativePageCopy.supportGuidance,
        successMessage: typeof specPageObj.successMessage === 'string' ? specPageObj.successMessage : DEFAULT_CAREERS_PAGE_CONTENT.speculativePageCopy.successMessage,
      };

      const content: CareersPageContentData = {
        heroHeading,
        heroSubtitle,
        cultureCards,
        careersImage,
        benefitsHeading,
        benefitsSubtitle,
        benefitsCards,
        opportunitiesHeading,
        opportunitiesSubtitle,
        searchPlaceholder,
        emptyStateCopy,
        speculativeCta,
        speculativePageCopy,
      };

      const defObj = sections.sharedDefaults || {};
      const sharedDefaults: SharedCareersDefaultsData = {
        interviewStages: Array.isArray(defObj.interviewStages) && defObj.interviewStages.length > 0
          ? defObj.interviewStages
          : DEFAULT_SHARED_CAREERS_DEFAULTS.interviewStages,
        commonBenefits: Array.isArray(defObj.commonBenefits) && defObj.commonBenefits.length > 0
          ? defObj.commonBenefits
          : Array.isArray(defObj.defaultBenefits) && defObj.defaultBenefits.length > 0
          ? defObj.defaultBenefits
          : DEFAULT_SHARED_CAREERS_DEFAULTS.commonBenefits,
        defaultReferralBonus: typeof defObj.defaultReferralBonus === 'string'
          ? defObj.defaultReferralBonus
          : typeof defObj.referralBonusAmount === 'string'
          ? defObj.referralBonusAmount
          : DEFAULT_SHARED_CAREERS_DEFAULTS.defaultReferralBonus,
        defaultPrivacyText: typeof defObj.defaultPrivacyText === 'string'
          ? defObj.defaultPrivacyText
          : typeof defObj.defaultPrivacyCopy === 'string'
          ? defObj.defaultPrivacyCopy
          : DEFAULT_SHARED_CAREERS_DEFAULTS.defaultPrivacyText,
      };

      return { data: content, sharedDefaults };
    }
  } catch (err) {
    console.warn('[Get Careers Page Content Notice]:', err);
  }

  return {
    data: DEFAULT_CAREERS_PAGE_CONTENT,
    sharedDefaults: DEFAULT_SHARED_CAREERS_DEFAULTS,
  };
}

export async function updateCareersPageContent(
  content: Partial<CareersPageContentData>,
  sharedDefaults?: Partial<SharedCareersDefaultsData>
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();

    // Fetch existing content
    const current = await getCareersPageContent();
    const mergedContent = { ...current.data, ...content };
    const mergedDefaults = { ...current.sharedDefaults, ...(sharedDefaults || {}) };

    const sectionsPayload = {
      ...mergedContent,
      sharedDefaults: mergedDefaults,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageModel = (db as any).pageContent;
    if (pageModel && typeof pageModel.upsert === 'function') {
      await pageModel.upsert({
        where: { pageKey: 'careers' },
        create: {
          pageKey: 'careers',
          title: 'Careers & Talent Portal',
          status: 'published',
          sections: sectionsPayload,
        },
        update: {
          title: 'Careers & Talent Portal',
          status: 'published',
          sections: sectionsPayload,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.$executeRaw`
        INSERT INTO page_contents (page_key, title, status, sections, created_at, updated_at)
        VALUES ('careers', 'Careers & Talent Portal', 'published', ${JSON.stringify(sectionsPayload)}::jsonb, NOW(), NOW())
        ON CONFLICT (page_key) DO UPDATE SET
          sections = ${JSON.stringify(sectionsPayload)}::jsonb,
          updated_at = NOW();
      `;
    }

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');
    safeRevalidate('/contact');

    return { success: true, message: 'Careers page content published successfully' };
  } catch (err) {
    console.error('[Update Careers Content Error]:', err);
    return { success: false, error: 'Failed to update careers content' };
  }
}

// ==========================================
// 2. CANONICAL ROLE CATEGORIES
// ==========================================

export async function getJobCategories(): Promise<{ data: JobCategory[]; error?: string }> {
  try {
    const records = await db.jobCategory.findMany({
      where: { isArchived: false },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { openings: true },
        },
      },
    });

    const categories: JobCategory[] = records.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      orderIndex: c.orderIndex,
      active: c.active,
      openingCount: c._count?.openings || 0,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return { data: categories };
  } catch (err) {
    console.warn('[Get JobCategories Prisma Notice - Fallback]:', err);
    try {
      const rows = await db.$queryRaw<
        Array<{
          id: string;
          name: string;
          slug: string;
          order_index: number;
          active: boolean;
          created_at: Date;
          updated_at: Date;
          opening_count: number;
        }>
      >`
        SELECT 
          c.id, c.name, c.slug, c.order_index, c.active, c.created_at, c.updated_at,
          COUNT(o.id)::int as opening_count
        FROM job_categories c
        LEFT JOIN job_openings o ON o.category_id = c.id
        WHERE c.is_archived = false
        GROUP BY c.id
        ORDER BY c.order_index ASC
      `;

      const categories = rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        orderIndex: r.order_index,
        active: r.active,
        openingCount: Number(r.opening_count) || 0,
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
      }));

      return { data: categories };
    } catch (sqlErr) {
      console.error('[Get JobCategories SQL Fallback Error]:', sqlErr);
      return { data: [], error: 'Failed to fetch categories' };
    }
  }
}

export async function createJobCategory(
  data: JobCategoryInput
): Promise<AdminActionResponse<JobCategory>> {
  try {
    await requireAdminUser();
    const rawSlug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = rawSlug || `cat-${Date.now()}`;

    // Get next order index if not supplied
    let nextOrder = data.orderIndex ?? 0;
    if (nextOrder === 0) {
      const maxOrder = await db.jobCategory.aggregate({
        _max: { orderIndex: true },
      });
      nextOrder = (maxOrder._max.orderIndex || 0) + 1;
    }

    const created = await db.jobCategory.create({
      data: {
        name: data.name.trim(),
        slug,
        orderIndex: nextOrder,
        active: data.active !== false,
      },
    });

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');

    return {
      success: true,
      data: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        orderIndex: created.orderIndex,
        active: created.active,
        openingCount: 0,
        createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('[Create Category Error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to create category' };
  }
}

export async function updateJobCategory(
  id: string,
  data: Partial<JobCategoryInput>
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const updateData: Prisma.JobCategoryUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
      // Also sync department string on associated openings
      try {
        await db.jobOpening.updateMany({
          where: { categoryId: id },
          data: { department: data.name.trim() },
        });
      } catch {}
    }

    if (data.slug !== undefined) {
      updateData.slug = data.slug.trim();
    }

    if (data.orderIndex !== undefined) {
      updateData.orderIndex = data.orderIndex;
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    await db.jobCategory.update({
      where: { id },
      data: updateData,
    });

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');

    return { success: true, message: 'Category updated successfully' };
  } catch (err) {
    console.error('[Update Category Error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to update category' };
  }
}

export async function deleteJobCategory(
  id: string,
  reassignToCategoryId?: string
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();

    // Check if category has associated openings
    const openCount = await db.jobOpening.count({
      where: { categoryId: id },
    });

    if (openCount > 0) {
      if (reassignToCategoryId) {
        // Reassign openings first
        await db.jobOpening.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignToCategoryId },
        });
      } else {
        // Soft delete / archive to protect existing positions
        await db.jobCategory.update({
          where: { id },
          data: { active: false, isArchived: true },
        });
        safeRevalidate('/recruitment');
        safeRevalidate('/careers');
        return {
          success: true,
          message: `Category contains ${openCount} active position(s). It has been safely archived instead of deleted.`,
        };
      }
    }

    await db.jobCategory.delete({
      where: { id },
    });

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');
    return { success: true, message: 'Category deleted successfully' };
  } catch (err) {
    console.error('[Delete Category Error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to delete category' };
  }
}

export async function reorderJobCategory(
  id: string,
  direction: 'up' | 'down'
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const categories = await db.jobCategory.findMany({
      where: { isArchived: false },
      orderBy: { orderIndex: 'asc' },
    });

    const currentIndex = categories.findIndex((c) => c.id === id);
    if (currentIndex === -1) {
      return { success: false, error: 'Category not found' };
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) {
      return { success: true, message: 'Already at extreme position' };
    }

    const current = categories[currentIndex];
    const target = categories[targetIndex];

    await db.$transaction([
      db.jobCategory.update({
        where: { id: current.id },
        data: { orderIndex: target.orderIndex },
      }),
      db.jobCategory.update({
        where: { id: target.id },
        data: { orderIndex: current.orderIndex },
      }),
    ]);

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');
    return { success: true, message: 'Category reordered successfully' };
  } catch (err) {
    console.error('[Reorder Category Error]:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to reorder category' };
  }
}

// ==========================================
// 3. JOB OPENINGS (RICH CRUD)
// ==========================================

export async function getJobOpenings(): Promise<{ data: AdminJobOpening[]; error?: string }> {
  try {
    const records = await db.jobOpening.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        category: true,
      },
    });

    if (records) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: AdminJobOpening[] = records.map((job: any) => ({
        id: job.id,
        categoryId: job.categoryId || null,
        category: job.category
          ? {
              id: job.category.id,
              name: job.category.name,
              slug: job.category.slug,
              orderIndex: job.category.orderIndex,
              active: job.category.active,
              createdAt: job.category.createdAt ? new Date(job.category.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: job.category.updatedAt ? new Date(job.category.updatedAt).toISOString() : new Date().toISOString(),
            }
          : null,
        title: job.title,
        slug: job.slug,
        department: job.department,
        employmentType: job.employmentType || 'Full-Time',
        workMode: job.workMode || 'Remote',
        geographicLocation: job.geographicLocation || 'Worldwide',
        experienceLevel: job.experienceLevel || 'Experienced',
        experience: job.experience,
        minExperienceYears: job.minExperienceYears,
        maxExperienceYears: job.maxExperienceYears,
        type: job.type || `${job.employmentType || 'Full-Time'} / ${job.workMode || 'Remote'}`,
        location: job.location || `${job.geographicLocation || 'Worldwide'} · ${job.workMode || 'Remote'}`,
        description: job.description,
        skills: job.skills || [],
        salary: job.salary,
        showSalary: job.showSalary === true,
        applyUrl: job.applyUrl || `/careers/${job.slug}#apply`,
        active: job.active,
        orderIndex: job.orderIndex,
        publishedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : null,
        referralBonus: job.referralBonus || '$2,500',
        showReferralBonus: job.showReferral !== false,
        useSharedDefaults: job.useSharedBenefits !== false,
        responsibilities: job.responsibilities || [],
        requirements: job.requirements || [],
        niceToHave: job.niceToHave || [],
        benefits: job.benefits || [],
        interviewStages: job.interviewStages || null,
        metaTitle: job.metaTitle || null,
        metaDescription: job.metaDescription || null,
        createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : new Date().toISOString(),
      }));

      return { data: mapped };
    }
  } catch (prismaErr) {
    console.warn('[Admin Recruitment Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
    try {
      const rows = await db.$queryRaw<
        Array<{
          id: string;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          category_order: number | null;
          category_active: boolean | null;
          title: string;
          slug: string;
          department: string;
          employment_type: string;
          work_mode: string;
          geographic_location: string;
          experience_level: string;
          experience: string | null;
          min_experience_years: number | null;
          max_experience_years: number | null;
          type: string;
          location: string;
          description: string;
          skills: string[];
          salary: string | null;
          show_salary: boolean;
          apply_url: string | null;
          active: boolean;
          order_index: number;
          published_at: Date | null;
          referral_bonus: string | null;
          show_referral: boolean;
          use_shared_benefits: boolean;
          responsibilities: string[];
          requirements: string[];
          nice_to_have: string[];
          benefits: string[];
          interview_stages: unknown;
          meta_title: string | null;
          meta_description: string | null;
          created_at: Date;
          updated_at: Date;
        }>
      >`
        SELECT 
          o.*,
          c.name as category_name,
          c.slug as category_slug,
          c.order_index as category_order,
          c.active as category_active
        FROM job_openings o
        LEFT JOIN job_categories c ON c.id = o.category_id
        ORDER BY o.order_index ASC
      `;

      const mapped: AdminJobOpening[] = rows.map((job) => ({
        id: job.id,
        categoryId: job.category_id || null,
        category: job.category_id && job.category_name
          ? {
              id: job.category_id,
              name: job.category_name,
              slug: job.category_slug || '',
              orderIndex: job.category_order || 0,
              active: job.category_active !== false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null,
        title: job.title,
        slug: job.slug,
        department: job.department,
        employmentType: job.employment_type || 'Full-Time',
        workMode: job.work_mode || 'Remote',
        geographicLocation: job.geographic_location || 'Worldwide',
        experienceLevel: job.experience_level || 'Experienced',
        experience: job.experience,
        minExperienceYears: job.min_experience_years,
        maxExperienceYears: job.max_experience_years,
        type: job.type || `${job.employment_type || 'Full-Time'} / ${job.work_mode || 'Remote'}`,
        location: job.location || `${job.geographic_location || 'Worldwide'} · ${job.work_mode || 'Remote'}`,
        description: job.description,
        skills: job.skills || [],
        salary: job.salary,
        showSalary: job.show_salary === true,
        applyUrl: job.apply_url || `/careers/${job.slug}#apply`,
        active: job.active,
        orderIndex: job.order_index,
        publishedAt: job.published_at ? new Date(job.published_at).toISOString() : null,
        referralBonus: job.referral_bonus || '$2,500',
        showReferralBonus: job.show_referral !== false,
        useSharedDefaults: job.use_shared_benefits !== false,
        responsibilities: job.responsibilities || [],
        requirements: job.requirements || [],
        niceToHave: job.nice_to_have || [],
        benefits: job.benefits || [],
        interviewStages: job.interview_stages as AdminJobOpening['interviewStages'],
        metaTitle: job.meta_title || null,
        metaDescription: job.meta_description || null,
        createdAt: job.created_at ? new Date(job.created_at).toISOString() : new Date().toISOString(),
        updatedAt: job.updated_at ? new Date(job.updated_at).toISOString() : new Date().toISOString(),
      }));

      return { data: mapped };
    } catch (sqlErr) {
      console.error('[Admin Recruitment SQL Fallback Error]:', sqlErr);
    }
  }

  return { data: [] };
}

export async function createJobOpening(
  data: AdminJobOpeningInput
): Promise<AdminActionResponse<AdminJobOpening>> {
  try {
    await requireAdminUser();
    const rawSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = rawSlug || `job-${Date.now()}`;
    try {
      const existing = await db.jobOpening.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    } catch {}

    const orderIndex = data.orderIndex ?? 0;
    const employmentType = data.employmentType || 'Full-Time';
    const workMode = data.workMode || 'Remote';
    const geographicLocation = data.geographicLocation || 'Worldwide';
    const experienceLevel = data.experienceLevel || 'Experienced';
    const department = data.department || 'Engineering';
    const type = `${employmentType} / ${workMode}`;
    const location = `${geographicLocation} · ${workMode}`;

    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();

    // Auto-resolve categoryId if missing but department is supplied
    let categoryId = data.categoryId || null;
    if (!categoryId && department) {
      try {
        const cat = await db.jobCategory.findFirst({
          where: {
            OR: [
              { name: { equals: department, mode: 'insensitive' } },
              { slug: { equals: department.toLowerCase().replace(/[^a-z0-9]+/g, '-'), mode: 'insensitive' } },
            ],
          },
        });
        if (cat) categoryId = cat.id;
      } catch {}
    }

    const created = await db.jobOpening.create({
      data: {
        title: data.title.trim(),
        slug,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        department,
        employmentType,
        workMode,
        geographicLocation,
        experienceLevel,
        experience: data.experience || (data.minExperienceYears ? `${data.minExperienceYears}+ Years` : null),
        minExperienceYears: data.minExperienceYears ?? null,
        maxExperienceYears: data.maxExperienceYears ?? null,
        type,
        location,
        description: data.description.trim(),
        skills: data.skills || [],
        salary: data.salary || null,
        showSalary: data.showSalary === true,
        applyUrl: data.applyUrl || `/careers/${slug}#apply`,
        active: data.active !== false,
        status: data.active !== false ? 'active' : 'draft',
        orderIndex,
        publishedAt,
        referralBonus: data.referralBonus || '$2,500',
        showReferral: data.showReferralBonus !== false,
        useSharedBenefits: data.useSharedDefaults !== false,
        useSharedInterview: data.useSharedDefaults !== false,
        responsibilities: data.responsibilities || [],
        requirements: data.requirements || [],
        niceToHave: data.niceToHave || [],
        benefits: data.benefits || [],
        interviewStages: data.interviewStages || [],
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
      },
      include: {
        category: true,
      },
    });

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');
    safeRevalidate(`/careers/${slug}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdRaw = created as any;
    return {
      success: true,
      data: {
        id: createdRaw.id,
        categoryId: createdRaw.categoryId || createdRaw.category_id || null,
        category: createdRaw.category
          ? {
              id: createdRaw.category.id,
              name: createdRaw.category.name,
              slug: createdRaw.category.slug,
              orderIndex: createdRaw.category.orderIndex,
              active: createdRaw.category.active,
              createdAt: createdRaw.category.createdAt ? new Date(createdRaw.category.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: createdRaw.category.updatedAt ? new Date(createdRaw.category.updatedAt).toISOString() : new Date().toISOString(),
            }
          : null,
        title: createdRaw.title,
        slug: createdRaw.slug,
        department: createdRaw.department,
        employmentType: createdRaw.employmentType || 'Full-Time',
        workMode: createdRaw.workMode || 'Remote',
        geographicLocation: createdRaw.geographicLocation || 'Worldwide',
        experienceLevel: createdRaw.experienceLevel || 'Experienced',
        experience: createdRaw.experience,
        minExperienceYears: createdRaw.minExperienceYears,
        maxExperienceYears: createdRaw.maxExperienceYears,
        type: createdRaw.type,
        location: createdRaw.location,
        description: createdRaw.description,
        skills: createdRaw.skills || [],
        salary: createdRaw.salary,
        showSalary: createdRaw.showSalary === true,
        applyUrl: createdRaw.applyUrl,
        active: createdRaw.active,
        orderIndex: createdRaw.orderIndex,
        publishedAt: createdRaw.publishedAt ? new Date(createdRaw.publishedAt).toISOString() : null,
        referralBonus: createdRaw.referralBonus,
        showReferralBonus: createdRaw.showReferral !== false,
        useSharedDefaults: createdRaw.useSharedBenefits !== false,
        responsibilities: createdRaw.responsibilities || [],
        requirements: createdRaw.requirements || [],
        niceToHave: createdRaw.niceToHave || [],
        benefits: createdRaw.benefits || [],
        interviewStages: createdRaw.interviewStages as unknown as AdminJobOpening['interviewStages'],
        metaTitle: createdRaw.metaTitle,
        metaDescription: createdRaw.metaDescription,
        createdAt: createdRaw.createdAt ? new Date(createdRaw.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: createdRaw.updatedAt ? new Date(createdRaw.updatedAt).toISOString() : new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[Create JobOpening Error]:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to create job opening' };
  }
}

export async function updateJobOpening(
  id: string,
  data: Partial<AdminJobOpeningInput>
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim();
    if (data.categoryId !== undefined) {
      if (data.categoryId) {
        updateData.category = { connect: { id: data.categoryId } };
      } else {
        updateData.category = { disconnect: true };
      }
    }
    if (data.department !== undefined) updateData.department = data.department;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.workMode !== undefined) updateData.workMode = data.workMode;
    if (data.geographicLocation !== undefined) updateData.geographicLocation = data.geographicLocation;
    if (data.experienceLevel !== undefined) updateData.experienceLevel = data.experienceLevel;
    if (data.minExperienceYears !== undefined) updateData.minExperienceYears = data.minExperienceYears;
    if (data.maxExperienceYears !== undefined) updateData.maxExperienceYears = data.maxExperienceYears;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.showSalary !== undefined) updateData.showSalary = data.showSalary;
    if (data.applyUrl !== undefined) updateData.applyUrl = data.applyUrl;
    if (data.active !== undefined) {
      updateData.active = data.active;
      updateData.status = data.active ? 'active' : 'draft';
    }
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;
    if (data.referralBonus !== undefined) updateData.referralBonus = data.referralBonus;
    if (data.showReferralBonus !== undefined) {
      updateData.showReferral = data.showReferralBonus;
    }
    if (data.useSharedDefaults !== undefined) {
      updateData.useSharedBenefits = data.useSharedDefaults;
      updateData.useSharedInterview = data.useSharedDefaults;
    }
    if (data.responsibilities !== undefined) updateData.responsibilities = data.responsibilities;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.niceToHave !== undefined) updateData.niceToHave = data.niceToHave;
    if (data.benefits !== undefined) updateData.benefits = data.benefits;
    if (data.interviewStages !== undefined) {
      updateData.interviewStages = data.interviewStages ? data.interviewStages : [];
    }
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;

    // Derived fields
    const emp = data.employmentType || 'Full-Time';
    const wm = data.workMode || 'Remote';
    const geo = data.geographicLocation || 'Worldwide';
    if (data.employmentType !== undefined || data.workMode !== undefined) {
      updateData.type = `${emp} / ${wm}`;
    }
    if (data.geographicLocation !== undefined || data.workMode !== undefined) {
      updateData.location = `${geo} · ${wm}`;
    }

    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }

    const updated = await db.jobOpening.update({
      where: { id },
      data: updateData,
    });

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');
    safeRevalidate(`/careers/${updated.slug}`);

    return { success: true, message: 'Job opening updated successfully' };
  } catch (error) {
    console.error('[Update JobOpening Error]:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to update job opening' };
  }
}

export async function deleteJobOpening(id: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const existing = await db.jobOpening.findUnique({ where: { id } });

    await db.jobOpening.delete({ where: { id } });

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');
    if (existing?.slug) {
      safeRevalidate(`/careers/${existing.slug}`);
    }

    return { success: true, message: 'Job opening removed successfully' };
  } catch (error) {
    console.error('[Delete JobOpening Error]:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to delete job opening' };
  }
}

export async function reorderJobOpening(
  id: string,
  direction: 'up' | 'down'
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const openings = await db.jobOpening.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const currentIndex = openings.findIndex((j) => j.id === id);
    if (currentIndex === -1) {
      return { success: false, error: 'Job opening not found' };
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= openings.length) {
      return { success: true, message: 'Already at extreme position' };
    }

    const currentOpening = openings[currentIndex];
    const targetOpening = openings[targetIndex];

    await db.$transaction([
      db.jobOpening.update({
        where: { id: currentOpening.id },
        data: { orderIndex: targetOpening.orderIndex },
      }),
      db.jobOpening.update({
        where: { id: targetOpening.id },
        data: { orderIndex: currentOpening.orderIndex },
      }),
    ]);

    safeRevalidate('/recruitment');
    safeRevalidate('/careers');
    return { success: true, message: 'Order updated successfully' };
  } catch (error) {
    console.error('[Reorder JobOpening Error]:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to reorder job opening' };
  }
}

export async function toggleJobOpeningStatus(
  id: string,
  active: boolean
): Promise<AdminActionResponse> {
  return updateJobOpening(id, { active });
}

// ==========================================
// 4. CANDIDATE APPLICATIONS (INBOX)
// ==========================================

export async function getJobApplications(filter?: {
  status?: string;
  type?: string;
  jobId?: string;
}): Promise<{ data: AdminJobApplication[]; total: number; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (filter?.status && filter.status !== 'all') {
      where.status = filter.status;
    }
    if (filter?.type && filter.type !== 'all') {
      where.type = filter.type;
    }
    if (filter?.jobId && filter.jobId !== 'all') {
      where.jobOpeningId = filter.jobId;
    }

    const records = await db.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: AdminJobApplication[] = records.map((a: any) => ({
      id: a.id,
      applicationNumber: a.applicationNumber || `AST-APP-${a.id.substring(0, 6).toUpperCase()}`,
      type: (a.type as 'job' | 'speculative') || 'job',
      jobId: a.jobOpeningId || null,
      jobTitle: a.roleTitle || 'Engineering Candidate',
      applicantName: a.candidateName,
      email: a.email,
      phone: a.phone || null,
      location: a.location || 'Remote',
      experienceLevel: a.experienceLevel || 'experienced',
      experienceYears: a.experienceYears !== undefined && a.experienceYears !== null ? `${a.experienceYears}` : null,
      categoryInterests: [],
      githubUrl: a.githubUrl || null,
      portfolioUrl: a.portfolioUrl || null,
      linkedinUrl: a.linkedinUrl || null,
      resumeType: (a.resumeType as 'upload' | 'link') || 'upload',
      resumeStorageProvider: a.resumeStorageProvider || null,
      resumeStorageBucket: null,
      resumeStorageKey: a.resumeStorageKey || null,
      resumeOriginalName: a.resumeOriginalName || null,
      resumeMimeType: a.resumeMimeType || null,
      resumeSizeBytes: a.resumeSizeBytes || null,
      resumeUrl: a.resumeUrl || null,
      candidateNote: a.coverNote || null,
      privacyConsent: true,
      status: (a.status as AdminJobApplication['status']) || 'pending',
      adminNotes: a.adminNotes || null,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return { data: mapped, total: mapped.length };
  } catch (error) {
    console.warn('[Get JobApplications Prisma Notice - Falling back]:', error);
    try {
      const rows = await db.$queryRaw<
        Array<{
          id: string;
          application_number: string | null;
          type: string;
          job_opening_id: string | null;
          role_title: string;
          candidate_name: string;
          email: string;
          phone: string | null;
          location: string | null;
          experience_level: string;
          experience_years: number | null;
          github_url: string | null;
          portfolio_url: string | null;
          linkedin_url: string | null;
          resume_type: string;
          resume_storage_provider: string | null;
          resume_storage_key: string | null;
          resume_original_name: string | null;
          resume_mime_type: string | null;
          resume_size_bytes: number | null;
          resume_url: string | null;
          cover_note: string | null;
          status: string;
          admin_notes: string | null;
          created_at: Date;
          updated_at: Date;
        }>
      >`
        SELECT * FROM job_applications
        ORDER BY created_at DESC
        LIMIT 200
      `;

      const mapped: AdminJobApplication[] = rows.map((a) => ({
        id: a.id,
        applicationNumber: a.application_number || `AST-APP-${a.id.substring(0, 6).toUpperCase()}`,
        type: (a.type as 'job' | 'speculative') || 'job',
        jobId: a.job_opening_id,
        jobTitle: a.role_title || 'Engineering Candidate',
        applicantName: a.candidate_name,
        email: a.email,
        phone: a.phone,
        location: a.location || 'Remote',
        experienceLevel: a.experience_level || 'experienced',
        experienceYears: a.experience_years !== null && a.experience_years !== undefined ? `${a.experience_years}` : null,
        categoryInterests: [],
        githubUrl: a.github_url,
        portfolioUrl: a.portfolio_url,
        linkedinUrl: a.linkedin_url,
        resumeType: (a.resume_type as 'upload' | 'link') || 'upload',
        resumeStorageProvider: a.resume_storage_provider,
        resumeStorageBucket: null,
        resumeStorageKey: a.resume_storage_key,
        resumeOriginalName: a.resume_original_name,
        resumeMimeType: a.resume_mime_type,
        resumeSizeBytes: a.resume_size_bytes,
        resumeUrl: a.resume_url,
        candidateNote: a.cover_note,
        privacyConsent: true,
        status: (a.status as AdminJobApplication['status']) || 'pending',
        adminNotes: a.admin_notes,
        createdAt: new Date(a.created_at).toISOString(),
        updatedAt: new Date(a.updated_at).toISOString(),
      }));

      return { data: mapped, total: mapped.length };
    } catch (sqlErr) {
      console.error('[Get JobApplications SQL Fallback Error]:', sqlErr);
      return { data: [], total: 0, error: 'Failed to fetch job applications' };
    }
  }
}

export async function updateApplicationStatus(
  id: string,
  status: 'pending' | 'reviewed' | 'interview' | 'offered' | 'hired' | 'rejected' | 'archived',
  adminNotes?: string
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();

    const data: Prisma.JobApplicationUpdateInput = { status };
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    await db.jobApplication.update({
      where: { id },
      data,
    });

    safeRevalidate('/recruitment');
    return { success: true, message: `Application status updated to ${status}` };
  } catch (error) {
    console.error('[Update ApplicationStatus Error]:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to update application status' };
  }
}
