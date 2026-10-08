-- ==============================================================================
-- Migration: 013_careers_and_roles_architecture.sql
-- Description: Canonical role categories, enriched job opening schema, dedicated job applications, and RLS policies
-- ==============================================================================

-- 0. Ensure is_admin helper function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT (role = 'ADMIN') FROM public."user" WHERE id::text = auth.uid()::text),
        true
    );
EXCEPTION WHEN OTHERS THEN
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Create Job Categories Table
CREATE TABLE IF NOT EXISTS public.job_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Enrich Job Openings Table with additive columns
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES public.job_categories(id) ON DELETE SET NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100) DEFAULT 'full-time' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS work_mode VARCHAR(100) DEFAULT 'remote' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS geographic_location VARCHAR(255) DEFAULT 'Remote (Worldwide)' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'experienced' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS min_experience_years INTEGER;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS max_experience_years INTEGER;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS show_salary BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS responsibilities TEXT[] DEFAULT '{}' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS nice_to_have TEXT[] DEFAULT '{}' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}' NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS use_shared_benefits BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS interview_stages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS use_shared_interview BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS referral_bonus VARCHAR(100);
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS show_referral BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.job_openings ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITHOUT TIME ZONE;

-- 3. Create Dedicated Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    application_number VARCHAR(100) UNIQUE,
    type VARCHAR(50) DEFAULT 'job_specific' NOT NULL, -- 'job_specific' | 'speculative'
    job_opening_id TEXT REFERENCES public.job_openings(id) ON DELETE SET NULL,
    role_title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    candidate_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    country_code VARCHAR(10),
    location VARCHAR(255),
    experience_level VARCHAR(50) DEFAULT 'experienced' NOT NULL,
    experience_years INTEGER,
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    cover_note TEXT,
    resume_type VARCHAR(50) DEFAULT 'upload' NOT NULL, -- 'upload' | 'url'
    resume_url TEXT,
    resume_storage_key VARCHAR(500),
    resume_storage_provider VARCHAR(50) DEFAULT 'r2',
    resume_original_name VARCHAR(255),
    resume_mime_type VARCHAR(100),
    resume_size_bytes INTEGER,
    resume_validation_status VARCHAR(50) DEFAULT 'verified' NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected'
    admin_notes TEXT,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_job_openings_category_id ON public.job_openings(category_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_active_order ON public.job_openings(active, order_index);
CREATE INDEX IF NOT EXISTS idx_job_categories_order ON public.job_categories(order_index) WHERE active = true AND is_archived = false;
CREATE INDEX IF NOT EXISTS idx_job_applications_created ON public.job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_opening_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Job Categories: Public read active non-archived, admin full access
DROP POLICY IF EXISTS "Public can read active job_categories" ON public.job_categories;
CREATE POLICY "Public can read active job_categories"
    ON public.job_categories
    FOR SELECT
    TO public
    USING (active = true AND is_archived = false);

DROP POLICY IF EXISTS "Admins have full access to job_categories" ON public.job_categories;
CREATE POLICY "Admins have full access to job_categories"
    ON public.job_categories
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Job Applications: Public can INSERT only (no select/update/delete); admin full access
DROP POLICY IF EXISTS "Public can submit job applications" ON public.job_applications;
CREATE POLICY "Public can submit job applications"
    ON public.job_applications
    FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to job_applications" ON public.job_applications;
CREATE POLICY "Admins have full access to job_applications"
    ON public.job_applications
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Initial Seed Canonical Role Categories
INSERT INTO public.job_categories (id, name, slug, description, order_index, active)
VALUES
    ('cat-eng', 'Engineering', 'engineering', 'Core systems, full-stack architectures, and frontend applications', 1, true),
    ('cat-ai', 'AI & Automation', 'ai-automation', 'Cognitive agents, machine learning pipelines, and LLM architectures', 2, true),
    ('cat-cloud', 'Cloud Ops', 'cloud-ops', 'Site reliability, edge infrastructure, CI/CD, and multi-region deployment', 3, true),
    ('cat-design', 'Design & Creative', 'design-creative', 'UI/UX systems, product design, and interactive interfaces', 4, true),
    ('cat-product', 'Product & Strategy', 'product-strategy', 'Technical product management, architecture roadmaps, and delivery', 5, true),
    ('cat-security', 'Cybersecurity & Compliance', 'cybersecurity-compliance', 'ISO 27001, SOC-2, vulnerability research, and security audits', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- 7. Link existing Job Openings to Canonical Categories & populate published_at
UPDATE public.job_openings
SET category_id = 'cat-eng'
WHERE (department ILIKE '%engineer%' OR department ILIKE '%dev%') AND category_id IS NULL;

UPDATE public.job_openings
SET category_id = 'cat-ai'
WHERE (department ILIKE '%ai%' OR department ILIKE '%automation%') AND category_id IS NULL;

UPDATE public.job_openings
SET category_id = 'cat-cloud'
WHERE (department ILIKE '%cloud%' OR department ILIKE '%ops%' OR department ILIKE '%devops%') AND category_id IS NULL;

UPDATE public.job_openings
SET published_at = created_at
WHERE published_at IS NULL;
