-- 010_update_reviews_workflow.sql
-- Migration to support Google Form feedback workflow, rating averages, and dual-gate publication permissions

ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS source_submission_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS project_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS overall_service_rating INTEGER,
    ADD COLUMN IF NOT EXISTS software_quality_rating INTEGER,
    ADD COLUMN IF NOT EXISTS communication_support_rating INTEGER,
    ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    ADD COLUMN IF NOT EXISTS display_rating INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS liked_most TEXT,
    ADD COLUMN IF NOT EXISTS would_recommend TEXT,
    ADD COLUMN IF NOT EXISTS improvement_feedback TEXT,
    ADD COLUMN IF NOT EXISTS original_review TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS review_text TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS website_publish_permission TEXT,
    ADD COLUMN IF NOT EXISTS can_publish_review BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS identity_display_permission TEXT NOT NULL DEFAULT 'Yes',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Backfill data from existing records
UPDATE public.reviews
SET 
    original_review = CASE WHEN original_review = '' THEN review ELSE original_review END,
    review_text = CASE WHEN review_text = '' THEN review ELSE review_text END,
    company_name = COALESCE(company_name, company),
    average_rating = COALESCE(average_rating, rating::numeric(3, 2), 5.00),
    display_rating = COALESCE(display_rating, rating, 5),
    can_publish_review = CASE WHEN status = 'approved' THEN true ELSE can_publish_review END,
    website_publish_permission = CASE WHEN status = 'approved' THEN 'Yes, you may publish my feedback' ELSE COALESCE(website_publish_permission, 'No, please keep my feedback private') END,
    submitted_at = COALESCE(submitted_at, created_at)
WHERE original_review = '' OR company_name IS NULL;

-- Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_reviews_source_submission_id ON public.reviews(source_submission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_can_publish ON public.reviews(can_publish_review);
CREATE INDEX IF NOT EXISTS idx_reviews_status_can_publish ON public.reviews(status, can_publish_review);
