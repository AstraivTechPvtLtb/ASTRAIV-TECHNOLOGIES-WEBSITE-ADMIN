-- 011_relational_cms_architecture.sql
-- Migration to introduce Relational CMS Architecture across 11 core entities and their join tables.

-- 1. Enhance services table with CMS controls and SEO
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 2. Create solutions table
CREATE TABLE IF NOT EXISTS public.solutions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'intelligent-systems',
    category_label TEXT,
    tagline TEXT,
    short_desc TEXT NOT NULL,
    full_desc TEXT,
    metric_value TEXT,
    metric_label TEXT,
    features TEXT[] DEFAULT '{}',
    technologies TEXT[] DEFAULT '{}',
    capabilities JSONB DEFAULT '[]'::jsonb,
    business_problem JSONB DEFAULT '{}'::jsonb,
    astraiv_approach JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'published',
    featured BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_solutions_slug ON public.solutions(slug);
CREATE INDEX IF NOT EXISTS idx_solutions_status ON public.solutions(status);
CREATE INDEX IF NOT EXISTS idx_solutions_order ON public.solutions(order_index ASC);

-- 3. Create industries table
CREATE TABLE IF NOT EXISTS public.industries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug TEXT UNIQUE NOT NULL,
    code TEXT,
    label TEXT NOT NULL,
    tagline TEXT,
    headline TEXT,
    image TEXT,
    image_alt TEXT,
    accent_color TEXT,
    status_text TEXT,
    compliance_badge TEXT,
    challenge TEXT,
    solution TEXT,
    pillars JSONB DEFAULT '[]'::jsonb,
    tech_stack TEXT[] DEFAULT '{}',
    kpis JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'published',
    featured BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_industries_slug ON public.industries(slug);
CREATE INDEX IF NOT EXISTS idx_industries_status ON public.industries(status);
CREATE INDEX IF NOT EXISTS idx_industries_order ON public.industries(order_index ASC);

-- 4. Create technologies table
CREATE TABLE IF NOT EXISTS public.technologies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Cpu',
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'published',
    featured BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_technologies_slug ON public.technologies(slug);
CREATE INDEX IF NOT EXISTS idx_technologies_status ON public.technologies(status);
CREATE INDEX IF NOT EXISTS idx_technologies_category ON public.technologies(category);

-- 5. Enhance portfolio_project (Case Studies) with rich metadata and relational fields
ALTER TABLE public.portfolio_project
    ADD COLUMN IF NOT EXISTS subtitle TEXT,
    ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'Client Project',
    ADD COLUMN IF NOT EXISTS credibility_badge TEXT DEFAULT 'Production Verified',
    ADD COLUMN IF NOT EXISTS credibility_note TEXT,
    ADD COLUMN IF NOT EXISTS is_real_client BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS verified_outcome BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS client TEXT,
    ADD COLUMN IF NOT EXISTS client_context TEXT,
    ADD COLUMN IF NOT EXISTS timeline TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Software Engineering',
    ADD COLUMN IF NOT EXISTS category_type TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS industry_slug TEXT,
    ADD COLUMN IF NOT EXISTS industry_name TEXT,
    ADD COLUMN IF NOT EXISTS challenge TEXT,
    ADD COLUMN IF NOT EXISTS challenge_details TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS solution_details TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS architecture_approach TEXT,
    ADD COLUMN IF NOT EXISTS architecture_highlights JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS development_process JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS measurable_results JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS tech_stack_by_category JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS testimonial_id TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;

CREATE INDEX IF NOT EXISTS idx_portfolio_project_status ON public.portfolio_project(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_project_order ON public.portfolio_project(order_index ASC);

-- 6. Enhance reviews (Testimonials)
ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- 7. Enhance blog_post (Articles / Insights)
ALTER TABLE public.blog_post
    ADD COLUMN IF NOT EXISTS reading_time TEXT,
    ADD COLUMN IF NOT EXISTS author_name TEXT,
    ADD COLUMN IF NOT EXISTS author_role TEXT,
    ADD COLUMN IF NOT EXISTS author_image TEXT,
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;

CREATE INDEX IF NOT EXISTS idx_blog_post_status ON public.blog_post(status);
CREATE INDEX IF NOT EXISTS idx_blog_post_order ON public.blog_post(order_index ASC);

-- 8. Create awards table
CREATE TABLE IF NOT EXISTS public.awards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL DEFAULT 'award',
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    year TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    achievement TEXT NOT NULL,
    verification_url TEXT,
    verification_label TEXT,
    badge_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'verified',
    published BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'Award',
    highlights TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_awards_status ON public.awards(status);
CREATE INDEX IF NOT EXISTS idx_awards_order ON public.awards(order_index ASC);

-- 9. Enhance job_openings (Jobs)
ALTER TABLE public.job_openings
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS meta_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 10. Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category TEXT NOT NULL DEFAULT 'general',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'published',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_status ON public.faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs(order_index ASC);

-- 11. Create Relational Join Tables (All 12 Bidirectional Mappings)

-- 11.1 Service <-> Solutions
CREATE TABLE IF NOT EXISTS public.service_solutions (
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    solution_id TEXT NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (service_id, solution_id)
);
CREATE INDEX IF NOT EXISTS idx_service_solutions_solution ON public.service_solutions(solution_id);

-- 11.2 Service <-> Industries
CREATE TABLE IF NOT EXISTS public.service_industries (
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    industry_id TEXT NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (service_id, industry_id)
);
CREATE INDEX IF NOT EXISTS idx_service_industries_industry ON public.service_industries(industry_id);

-- 11.3 Service <-> Technologies
CREATE TABLE IF NOT EXISTS public.service_technologies (
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    technology_id TEXT NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (service_id, technology_id)
);
CREATE INDEX IF NOT EXISTS idx_service_technologies_tech ON public.service_technologies(technology_id);

-- 11.4 Case Study <-> Services
CREATE TABLE IF NOT EXISTS public.case_study_services (
    case_study_id TEXT NOT NULL REFERENCES public.portfolio_project(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (case_study_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_case_study_services_service ON public.case_study_services(service_id);

-- 11.5 Case Study <-> Solutions
CREATE TABLE IF NOT EXISTS public.case_study_solutions (
    case_study_id TEXT NOT NULL REFERENCES public.portfolio_project(id) ON DELETE CASCADE,
    solution_id TEXT NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (case_study_id, solution_id)
);
CREATE INDEX IF NOT EXISTS idx_case_study_solutions_solution ON public.case_study_solutions(solution_id);

-- 11.6 Case Study <-> Industries
CREATE TABLE IF NOT EXISTS public.case_study_industries (
    case_study_id TEXT NOT NULL REFERENCES public.portfolio_project(id) ON DELETE CASCADE,
    industry_id TEXT NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (case_study_id, industry_id)
);
CREATE INDEX IF NOT EXISTS idx_case_study_industries_industry ON public.case_study_industries(industry_id);

-- 11.7 Case Study <-> Technologies
CREATE TABLE IF NOT EXISTS public.case_study_technologies (
    case_study_id TEXT NOT NULL REFERENCES public.portfolio_project(id) ON DELETE CASCADE,
    technology_id TEXT NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (case_study_id, technology_id)
);
CREATE INDEX IF NOT EXISTS idx_case_study_technologies_tech ON public.case_study_technologies(technology_id);

-- 11.8 Solution <-> Industries
CREATE TABLE IF NOT EXISTS public.solution_industries (
    solution_id TEXT NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    industry_id TEXT NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (solution_id, industry_id)
);
CREATE INDEX IF NOT EXISTS idx_solution_industries_industry ON public.solution_industries(industry_id);

-- 11.9 Article <-> Services
CREATE TABLE IF NOT EXISTS public.article_services (
    article_id TEXT NOT NULL REFERENCES public.blog_post(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_article_services_service ON public.article_services(service_id);

-- 11.10 Article <-> Solutions
CREATE TABLE IF NOT EXISTS public.article_solutions (
    article_id TEXT NOT NULL REFERENCES public.blog_post(id) ON DELETE CASCADE,
    solution_id TEXT NOT NULL REFERENCES public.solutions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, solution_id)
);
CREATE INDEX IF NOT EXISTS idx_article_solutions_solution ON public.article_solutions(solution_id);

-- 11.11 Article <-> Industries
CREATE TABLE IF NOT EXISTS public.article_industries (
    article_id TEXT NOT NULL REFERENCES public.blog_post(id) ON DELETE CASCADE,
    industry_id TEXT NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, industry_id)
);
CREATE INDEX IF NOT EXISTS idx_article_industries_industry ON public.article_industries(industry_id);

-- 11.12 Article <-> Case Studies
CREATE TABLE IF NOT EXISTS public.article_case_studies (
    article_id TEXT NOT NULL REFERENCES public.blog_post(id) ON DELETE CASCADE,
    case_study_id TEXT NOT NULL REFERENCES public.portfolio_project(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, case_study_id)
);
CREATE INDEX IF NOT EXISTS idx_article_case_studies_case_study ON public.article_case_studies(case_study_id);
