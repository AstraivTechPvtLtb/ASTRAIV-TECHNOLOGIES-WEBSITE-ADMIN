-- 006_create_blog_posts.sql
-- Table for blog articles and CMS content

CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author TEXT NOT NULL DEFAULT 'AstraIV Engineering Team',
    category TEXT NOT NULL DEFAULT 'Engineering',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER tr_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Public can view published blog posts
CREATE POLICY "Public can view published blog posts"
    ON public.blog_posts
    FOR SELECT
    TO public
    USING (status = 'published');

-- Admins have full access
CREATE POLICY "Authenticated users have full access to blog posts"
    ON public.blog_posts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
