-- 007_seed_initial_data.sql
-- Seed existing testimonials and case studies into PostgreSQL so production and dev environments have verified baseline data

-- Seed Reviews
INSERT INTO public.reviews (review_id, client_name, company, designation, review, rating, status, featured, published_at)
VALUES
    ('REV-SEED-001', 'Sarah Jenkins', 'Vercel Staging Partner', 'VP of Engineering', 'Astraiv''s team is exceptional. They restructured our entire cloud architecture on AWS using Next.js and reduced our server overhead by 42%. The UI aesthetics are Stripe-level premium.', 5, 'approved', true, timezone('utc'::text, now())),
    ('REV-SEED-002', 'Marcus Vance', 'Linear Integrations', 'Founder', 'Working with Astraiv Technologies has automated our entire CRM sync pipeline and customer portal. The project was delivered ahead of schedule and the codebase is flawlessly typed.', 5, 'approved', true, timezone('utc'::text, now())),
    ('REV-SEED-003', 'Elena Rostova', 'Framer Modules', 'CTO', 'Their attention to design details, micro-animations, and WCAG accessibility is unmatched. Our clients have commented on the dashboard speed. It feels incredibly premium.', 5, 'approved', true, timezone('utc'::text, now()))
ON CONFLICT (review_id) DO NOTHING;

-- Seed Projects / Case Studies
INSERT INTO public.projects (title, slug, short_description, description, client, industry, services, technologies, status, featured, metric, metric_label, gradient_color)
VALUES
    (
        'PulseFit Multi-Tenant Fitness Analytics Platform',
        'pulsefit',
        'A multi-tenant fitness analytics dashboard built with Next.js 16 and Prisma. We automated database synchronization and reduced page load times by 65%.',
        'High latency in database synchronization and slow dashboard rendering times were causing user drop-offs across multi-tenant fitness centers. We engineered a next-generation multi-tenant analytics dashboard built on Next.js 16 and Prisma, with edge caching and automated real-time database sync pipelines.',
        'PulseFit Global',
        'SaaS & HealthTech',
        ARRAY['Web Application', 'SaaS & HealthTech'],
        ARRAY['Next.js 16', 'Prisma ORM', 'PostgreSQL', 'Tailwind CSS', 'Cloudflare R2'],
        'published',
        true,
        '65% faster page loads',
        'Performance Increase',
        'from-blue-600 via-indigo-600 to-cyan-500'
    ),
    (
        'AeroSync Real-Time Logistics & Parcel Coordination',
        'aerosync',
        'Custom scheduling software that coordinates parcel distribution in real-time. Leverages WebSockets for instant tracking updates and optimized routes.',
        'Excessive route overhead, delayed dispatch updates, and manual parcel sorting across high-volume distribution fleets. Developed custom scheduling software coordinating parcel distribution in real-time leveraging WebSockets for instant tracking updates and AI-optimized routes.',
        'AeroSync Logistics Inc.',
        'Logistics AI & Cloud Infrastructure',
        ARRAY['Logistics AI', 'Backend System'],
        ARRAY['WebSockets', 'AI Route Engine', 'TypeScript', 'AWS Cloud', 'Docker'],
        'published',
        true,
        '-18% route fuel overhead',
        'Fleet Optimization',
        'from-purple-600 via-pink-600 to-indigo-600'
    ),
    (
        'FinanceFlow AI-Driven Budget & Ledger Engine',
        'financeflow',
        'An AI-driven budget analyzer integrating LLMs with bank ledger APIs. Includes secure credentials management and automated reconciliation loops.',
        'Manual financial reconciliation bottlenecks and complex bank ledger integration compliance requiring strict data isolation. Built an AI-driven budget analyzer integrating LLMs with bank ledger APIs, featuring secure credentials management and automated reconciliation loops.',
        'FinanceFlow Capital',
        'FinTech & Cognitive AI Agents',
        ARRAY['FinTech & AI', 'Backend System'],
        ARRAY['LLM Agents', 'Bank Ledger APIs', 'pgvector', 'TypeScript', 'SOC-2 Vault'],
        'published',
        true,
        'SOC-2 compliant storage',
        'Security Standard',
        'from-cyan-600 via-blue-600 to-emerald-500'
    )
ON CONFLICT (slug) DO NOTHING;
