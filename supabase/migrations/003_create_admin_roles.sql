-- 003_create_admin_roles.sql
-- Table for user roles and admin profiles integrated with Supabase Auth

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor', 'support')),
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON public.admin_profiles(role);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER tr_admin_profiles_updated_at
    BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Helper function to check if current session is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin', 'editor', 'support')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Authenticated users can read their own profile
CREATE POLICY "Admins can view profiles"
    ON public.admin_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update their own profile"
    ON public.admin_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
