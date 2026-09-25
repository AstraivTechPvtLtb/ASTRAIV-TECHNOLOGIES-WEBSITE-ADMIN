-- 012_production_security_rls_hardening.sql
-- Production Security Hardening: Row Level Security (RLS) & Access Policy Remediation
-- Enforces Principle of Least Privilege across all relational entities and authentication stores.

-- ==============================================================================
-- 1. Helper function: verify administrator privileges
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'editor', 'support')
    ) OR EXISTS (
        SELECT 1 FROM public."user"
        WHERE id::text = auth.uid()::text
        AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. Enable Row Level Security (RLS) on all core and join tables
-- ==============================================================================
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'user',
        'session',
        'account',
        'verification',
        'crm_lead',
        'contact_submissions',
        'reviews',
        'projects',
        'portfolio_project',
        'services',
        'solutions',
        'industries',
        'technologies',
        'case_study_services',
        'case_study_solutions',
        'case_study_industries',
        'case_study_technologies',
        'solution_industries',
        'article_services',
        'article_solutions',
        'article_industries',
        'article_case_studies',
        'blog_posts',
        'blog_post',
        'blog_category',
        'footer_settings',
        'social_links',
        'job_openings',
        'pricing_plans',
        'compliance_settings',
        'client_tickets'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 3. Inbound Lead Ingestion & Contact Forms (crm_lead, contact_submissions)
-- Public can INSERT prospective leads; only administrators can SELECT, UPDATE, or DELETE.
-- ==============================================================================
-- CRM Leads
DROP POLICY IF EXISTS "Public can submit project briefs to crm_lead" ON public.crm_lead;
CREATE POLICY "Public can submit project briefs to crm_lead"
    ON public.crm_lead
    FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to crm_lead" ON public.crm_lead;
CREATE POLICY "Admins have full access to crm_lead"
    ON public.crm_lead
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Contact Submissions
DROP POLICY IF EXISTS "Allow authenticated admins full access to contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins have full access to contact_submissions" ON public.contact_submissions;
CREATE POLICY "Admins have full access to contact_submissions"
    ON public.contact_submissions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 4. Customer Reviews & Testimonials
-- Public can only view APPROVED reviews flagged for publication.
-- Raw private ratings, unmoderated submissions, and admin notes are restricted.
-- ==============================================================================
DROP POLICY IF EXISTS "Authenticated users have full access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

CREATE POLICY "Public can view published approved reviews"
    ON public.reviews
    FOR SELECT
    TO public
    USING (
        status = 'approved' 
        AND (can_publish_review = true OR can_publish_review IS NULL)
    );

CREATE POLICY "Admins have full access to reviews"
    ON public.reviews
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. Relational CMS Entities (solutions, industries, technologies, joins)
-- Public can view active published content; modifications require administrator role.
-- ==============================================================================
-- Solutions
DROP POLICY IF EXISTS "Public can read published solutions" ON public.solutions;
CREATE POLICY "Public can read published solutions"
    ON public.solutions
    FOR SELECT
    TO public
    USING (active = true AND status = 'published');

DROP POLICY IF EXISTS "Admins have full access to solutions" ON public.solutions;
CREATE POLICY "Admins have full access to solutions"
    ON public.solutions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Industries
DROP POLICY IF EXISTS "Public can read published industries" ON public.industries;
CREATE POLICY "Public can read published industries"
    ON public.industries
    FOR SELECT
    TO public
    USING (active = true AND status = 'published');

DROP POLICY IF EXISTS "Admins have full access to industries" ON public.industries;
CREATE POLICY "Admins have full access to industries"
    ON public.industries
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Technologies
DROP POLICY IF EXISTS "Public can read published technologies" ON public.technologies;
CREATE POLICY "Public can read published technologies"
    ON public.technologies
    FOR SELECT
    TO public
    USING (active = true AND status = 'published');

DROP POLICY IF EXISTS "Admins have full access to technologies" ON public.technologies;
CREATE POLICY "Admins have full access to technologies"
    ON public.technologies
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- CMS Join Tables: Public read access, admin full access
DO $$
DECLARE
    tbl text;
    join_tables text[] := ARRAY[
        'case_study_services',
        'case_study_solutions',
        'case_study_industries',
        'case_study_technologies',
        'solution_industries',
        'article_services',
        'article_solutions',
        'article_industries',
        'article_case_studies'
    ];
BEGIN
    FOREACH tbl IN ARRAY join_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Public can read ' || tbl, tbl);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO public USING (true);', 'Public can read ' || tbl, tbl);

            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Admins can manage ' || tbl, tbl);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());', 'Admins can manage ' || tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 6. Remediate Over-Permissive Legacy Policies
-- Fix tables where "TO authenticated USING (true)" allowed any logged-in user full write access.
-- ==============================================================================
-- Projects
DROP POLICY IF EXISTS "Authenticated users have full access to projects" ON public.projects;
CREATE POLICY "Admins have full access to projects"
    ON public.projects
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Services
DROP POLICY IF EXISTS "Authenticated users have full access to services" ON public.services;
CREATE POLICY "Admins have full access to services"
    ON public.services
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Blog Posts
DROP POLICY IF EXISTS "Authenticated users have full access to blog_posts" ON public.blog_posts;
CREATE POLICY "Admins have full access to blog_posts"
    ON public.blog_posts
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Footer Settings & Social Links
DROP POLICY IF EXISTS "Authenticated users have full access to footer_settings" ON public.footer_settings;
CREATE POLICY "Admins have full access to footer_settings"
    ON public.footer_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users have full access to social_links" ON public.social_links;
CREATE POLICY "Admins have full access to social_links"
    ON public.social_links
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Job Openings & Pricing Plans
DROP POLICY IF EXISTS "Authenticated users have full access to job_openings" ON public.job_openings;
CREATE POLICY "Admins have full access to job_openings"
    ON public.job_openings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users have full access to pricing_plans" ON public.pricing_plans;
CREATE POLICY "Admins have full access to pricing_plans"
    ON public.pricing_plans
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. Sensitive Authentication & Session Tables
-- Prevent all public access to user credential hashes, session tokens, and OTP codes.
-- Managed strictly by Prisma server backend via direct connection or service_role.
-- ==============================================================================
-- User Table: Users can read their own profile; admins can manage
DROP POLICY IF EXISTS "Users can read own profile" ON public."user";
CREATE POLICY "Users can read own profile"
    ON public."user"
    FOR SELECT
    TO authenticated
    USING (id::text = auth.uid()::text OR public.is_admin());

-- Account, Session, Verification: NO public or regular authenticated access
-- Supabase service_role automatically bypasses RLS for elevated server workflows
REVOKE ALL ON TABLE public.account FROM anon, authenticated;
REVOKE ALL ON TABLE public.session FROM anon, authenticated;
REVOKE ALL ON TABLE public.verification FROM anon, authenticated;
