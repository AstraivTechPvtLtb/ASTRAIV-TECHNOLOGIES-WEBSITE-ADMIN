-- ==============================================================================
-- Migration: 009_create_recruitment_and_pricing.sql
-- Description: Create job_openings and pricing_plans tables with RLS and initial seeds
-- ==============================================================================

-- 1. Create Job Openings Table
CREATE TABLE IF NOT EXISTS public.job_openings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'Engineering',
    type VARCHAR(100) NOT NULL DEFAULT 'Full-Time / Remote',
    location VARCHAR(100) NOT NULL DEFAULT 'Remote',
    experience VARCHAR(100),
    description TEXT NOT NULL,
    skills TEXT[] NOT NULL DEFAULT '{}',
    salary VARCHAR(100),
    apply_url VARCHAR(255) DEFAULT '/contact',
    active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create Pricing Plans Table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    badge VARCHAR(100),
    is_popular BOOLEAN DEFAULT false NOT NULL,
    price_type VARCHAR(50) DEFAULT 'fixed' NOT NULL, -- 'fixed' or 'custom'
    price_monthly_inr DOUBLE PRECISION,
    price_yearly_inr DOUBLE PRECISION,
    price_monthly_usd DOUBLE PRECISION,
    price_yearly_usd DOUBLE PRECISION,
    custom_price_label VARCHAR(100) DEFAULT 'Custom',
    features TEXT[] NOT NULL DEFAULT '{}',
    button_text VARCHAR(100) DEFAULT 'Start Building' NOT NULL,
    button_url VARCHAR(255) DEFAULT '/contact' NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- 4. Public Read Policies
CREATE POLICY "Allow public read access for active job_openings" ON public.job_openings
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access for active pricing_plans" ON public.pricing_plans
    FOR SELECT USING (true);

-- 5. Admin / Authenticated Full Access Policies
CREATE POLICY "Allow full access for authenticated users on job_openings" ON public.job_openings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users on pricing_plans" ON public.pricing_plans
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Initial Seed Data for Job Openings (Matching live client website)
INSERT INTO public.job_openings (title, slug, department, type, location, description, skills, active, order_index)
VALUES 
    (
        'Senior Full-Stack Architect',
        'senior-full-stack-architect',
        'Engineering',
        'Full-Time / Remote',
        'Remote',
        'Lead high-throughput web applications and SaaS portal architectures using Next.js App Router, TypeScript, and Postgres.',
        ARRAY['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma'],
        true,
        1
    ),
    (
        'AI Systems & LLM Engineer',
        'ai-systems-llm-engineer',
        'AI & Automation',
        'Full-Time / Remote',
        'Remote',
        'Design and deploy state-of-the-art cognitive agents, hybrid vector retrieval (RAG), and asynchronous task queues.',
        ARRAY['Python', 'FastAPI', 'LangChain', 'Vector DBs', 'PyTorch', 'Agentic Workflows'],
        true,
        2
    ),
    (
        'Cloud & DevOps Infrastructure Lead',
        'cloud-devops-infrastructure-lead',
        'Cloud Ops',
        'Full-Time / Remote',
        'Remote',
        'Engineer zero-downtime CI/CD pipelines, container orchestration, edge caching on Cloudflare R2, and AWS infrastructure.',
        ARRAY['AWS', 'Cloudflare Workers/R2', 'Docker', 'Terraform', 'Turborepo', 'Security Hardening'],
        true,
        3
    )
ON CONFLICT (slug) DO NOTHING;

-- 7. Initial Seed Data for Pricing Plans (Matching live client website)
INSERT INTO public.pricing_plans (name, slug, description, badge, is_popular, price_type, price_monthly_inr, price_yearly_inr, price_monthly_usd, price_yearly_usd, custom_price_label, features, button_text, button_url, active, order_index)
VALUES
    (
        'Starter Plan',
        'starter-plan',
        'Ideal for early-stage startups needing a premium marketing website and brand system.',
        NULL,
        false,
        'fixed',
        399999,
        319999,
        4999,
        3999,
        NULL,
        ARRAY[
            'Custom Web Design (Framer/Next.js)',
            'SEO & Performance Tuning',
            'Standard Contact Integrations',
            '2 rounds of layout revisions',
            'Production Deployment & CI/CD',
            'Dedicated Email Support'
        ],
        'Start Building',
        '/contact',
        true,
        1
    ),
    (
        'Professional Plan',
        'professional-plan',
        'Our most popular plan, covering custom web applications, SaaS dashboards, and database setup.',
        'MOST POPULAR',
        true,
        'fixed',
        799999,
        639999,
        9999,
        7999,
        NULL,
        ARRAY[
            'Everything in Starter',
            'SaaS Dashboard & User Login',
            'Prisma & Postgres integrations',
            'Stripe payment stub setup',
            '2 weeks post-launch SLA support',
            'Dedicated Slack support channel'
        ],
        'Hire Our Architects',
        '/contact',
        true,
        2
    ),
    (
        'Enterprise Plan',
        'enterprise-plan',
        'For companies requiring dedicated cloud infrastructure, AI integrations, and full SLA support.',
        NULL,
        false,
        'custom',
        NULL,
        NULL,
        NULL,
        NULL,
        'Custom',
        ARRAY[
            'Custom AI & Agent workflow stubs',
            'Cloudflare R2 CDNs config',
            'AWS load-balanced hosting setup',
            'Role-Based admin dashboards',
            'Priority SLA 24/7 Response time',
            'Unlimited revision approvals'
        ],
        'Book a Consultation',
        '/contact',
        true,
        3
    )
ON CONFLICT (slug) DO NOTHING;
