-- 005_create_services.sql
-- Table for managing AstraIV services dynamically

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Cpu',
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON public.services(display_order ASC);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_services_updated_at ON public.services;
CREATE TRIGGER tr_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Public can view active services
CREATE POLICY "Public can view active services"
    ON public.services
    FOR SELECT
    TO public
    USING (status = 'active');

-- Authenticated full access
CREATE POLICY "Authenticated users have full access to services"
    ON public.services
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
