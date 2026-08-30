-- 002_create_reviews.sql
-- Table for client reviews, Google Form/Sheets synchronization, and public testimonials

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id TEXT UNIQUE,
    client_name TEXT NOT NULL,
    company TEXT,
    designation TEXT,
    review TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    featured BOOLEAN NOT NULL DEFAULT false,
    admin_note TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON public.reviews(featured);
CREATE INDEX IF NOT EXISTS idx_reviews_review_id ON public.reviews(review_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published_at ON public.reviews(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS tr_reviews_updated_at ON public.reviews;
CREATE TRIGGER tr_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to set published_at automatically when approved
CREATE OR REPLACE FUNCTION public.handle_review_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved' OR NEW.published_at IS NULL) THEN
        NEW.published_at = timezone('utc'::text, now());
    ELSIF NEW.status <> 'approved' THEN
        NEW.published_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_reviews_approval ON public.reviews;
CREATE TRIGGER tr_reviews_approval
    BEFORE INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_review_approval();

-- RLS Policies
-- 1. Public can only read APPROVED reviews (hides admin_note and pending/rejected)
CREATE POLICY "Public can view approved reviews"
    ON public.reviews
    FOR SELECT
    TO public
    USING (status = 'approved');

-- 2. Authenticated users (Admins) have full access to manage reviews
CREATE POLICY "Authenticated users have full access to reviews"
    ON public.reviews
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
