/**
 * @file admin/scripts/seed-recruitment-pricing.ts
 * @description Seeds initial JobOpenings and PricingPlans into the PostgreSQL database.
 */

import { db as prisma } from '../src/models/db';

async function main() {
  console.log('🚀 Seeding initial Job Openings and Pricing Plans...');

  // 1. Seed Job Openings
  const jobs = [
    {
      title: 'Senior Full-Stack Architect',
      slug: 'senior-full-stack-architect',
      department: 'Engineering',
      type: 'Full-Time / Remote',
      location: 'Remote',
      experience: '5+ Years',
      description:
        'Lead high-throughput web applications and SaaS portal architectures using Next.js App Router, TypeScript, and Postgres.',
      skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma'],
      salary: 'Top Market / Competitive',
      applyUrl: '/contact',
      active: true,
      orderIndex: 1,
    },
    {
      title: 'AI Systems & LLM Engineer',
      slug: 'ai-systems-llm-engineer',
      department: 'AI & Automation',
      type: 'Full-Time / Remote',
      location: 'Remote',
      experience: '3+ Years',
      description:
        'Design and deploy state-of-the-art cognitive agents, hybrid vector retrieval (RAG), and asynchronous task queues.',
      skills: ['Python', 'FastAPI', 'LangChain', 'Vector DBs', 'PyTorch', 'Agentic Workflows'],
      salary: 'Top Market / Competitive',
      applyUrl: '/contact',
      active: true,
      orderIndex: 2,
    },
    {
      title: 'Cloud & DevOps Infrastructure Lead',
      slug: 'cloud-devops-infrastructure-lead',
      department: 'Cloud Ops',
      type: 'Full-Time / Remote',
      location: 'Remote',
      experience: '4+ Years',
      description:
        'Engineer zero-downtime CI/CD pipelines, container orchestration, edge caching on Cloudflare R2, and AWS infrastructure.',
      skills: ['AWS', 'Cloudflare Workers/R2', 'Docker', 'Terraform', 'Turborepo', 'Security Hardening'],
      salary: 'Top Market / Competitive',
      applyUrl: '/contact',
      active: true,
      orderIndex: 3,
    },
  ];

  for (const job of jobs) {
    await prisma.jobOpening.upsert({
      where: { slug: job.slug },
      update: {
        title: job.title,
        department: job.department,
        type: job.type,
        location: job.location,
        description: job.description,
        skills: job.skills,
        active: job.active,
        orderIndex: job.orderIndex,
      },
      create: job,
    });
  }
  console.log(`✅ Seeded ${jobs.length} Job Openings.`);

  // 2. Seed Pricing Plans
  const plans = [
    {
      name: 'Starter Plan',
      slug: 'starter-plan',
      description: 'Ideal for early-stage startups needing a premium marketing website and brand system.',
      badge: null,
      isPopular: false,
      priceType: 'fixed',
      priceMonthlyInr: 399999,
      priceYearlyInr: 319999,
      priceMonthlyUsd: 4999,
      priceYearlyUsd: 3999,
      customPriceLabel: null,
      features: [
        'Custom Web Design (Framer/Next.js)',
        'SEO & Performance Tuning',
        'Standard Contact Integrations',
        '2 rounds of layout revisions',
        'Production Deployment & CI/CD',
        'Dedicated Email Support',
      ],
      buttonText: 'Start Building',
      buttonUrl: '/contact',
      active: true,
      orderIndex: 1,
    },
    {
      name: 'Professional Plan',
      slug: 'professional-plan',
      description: 'Our most popular plan, covering custom web applications, SaaS dashboards, and database setup.',
      badge: 'MOST POPULAR',
      isPopular: true,
      priceType: 'fixed',
      priceMonthlyInr: 799999,
      priceYearlyInr: 639999,
      priceMonthlyUsd: 9999,
      priceYearlyUsd: 7999,
      customPriceLabel: null,
      features: [
        'Everything in Starter',
        'SaaS Dashboard & User Login',
        'Prisma & Postgres integrations',
        'Stripe payment stub setup',
        '2 weeks post-launch SLA support',
        'Dedicated Slack support channel',
      ],
      buttonText: 'Hire Our Architects',
      buttonUrl: '/contact',
      active: true,
      orderIndex: 2,
    },
    {
      name: 'Enterprise Plan',
      slug: 'enterprise-plan',
      description: 'For companies requiring dedicated cloud infrastructure, AI integrations, and full SLA support.',
      badge: null,
      isPopular: false,
      priceType: 'custom',
      priceMonthlyInr: null,
      priceYearlyInr: null,
      priceMonthlyUsd: null,
      priceYearlyUsd: null,
      customPriceLabel: 'Custom',
      features: [
        'Custom AI & Agent workflow stubs',
        'Cloudflare R2 CDNs config',
        'AWS load-balanced hosting setup',
        'Role-Based admin dashboards',
        'Priority SLA 24/7 Response time',
        'Unlimited revision approvals',
      ],
      buttonText: 'Book a Consultation',
      buttonUrl: '/contact',
      active: true,
      orderIndex: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.pricingPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        badge: plan.badge,
        isPopular: plan.isPopular,
        priceType: plan.priceType,
        priceMonthlyInr: plan.priceMonthlyInr,
        priceYearlyInr: plan.priceYearlyInr,
        priceMonthlyUsd: plan.priceMonthlyUsd,
        priceYearlyUsd: plan.priceYearlyUsd,
        customPriceLabel: plan.customPriceLabel,
        features: plan.features,
        buttonText: plan.buttonText,
        buttonUrl: plan.buttonUrl,
        active: plan.active,
        orderIndex: plan.orderIndex,
      },
      create: plan,
    });
  }
  console.log(`✅ Seeded ${plans.length} Pricing Plans.`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
