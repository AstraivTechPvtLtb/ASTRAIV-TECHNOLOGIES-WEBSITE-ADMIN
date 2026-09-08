-- Create Footer Settings Table
CREATE TABLE IF NOT EXISTS public.footer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_tagline TEXT NOT NULL DEFAULT 'Your trusted partner for AI, enterprise software, and scalable cloud systems.',
    phone VARCHAR(50) NOT NULL DEFAULT '+91 8167409664',
    email VARCHAR(255) NOT NULL DEFAULT 'info@astraivtechnologies.com',
    address TEXT NOT NULL DEFAULT 'Ashoknagar, Kolkata',
    map_url TEXT DEFAULT 'https://maps.google.com/?q=Ashoknagar,+Kolkata',
    copyright_text TEXT DEFAULT 'Astraiv Technologies. All rights reserved.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Social Links Table
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'globe' NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Allow public read access for footer_settings" ON public.footer_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access for active social_links" ON public.social_links
    FOR SELECT USING (active = true);

-- Service / Authenticated Admin Write Policies
CREATE POLICY "Allow full access for authenticated admins on footer_settings" ON public.footer_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated admins on social_links" ON public.social_links
    FOR ALL USING (auth.role() = 'authenticated');

-- Initial Seed Data
INSERT INTO public.footer_settings (brand_tagline, phone, email, address, map_url, copyright_text)
VALUES (
    'Your trusted partner for AI, enterprise software, and scalable cloud systems.',
    '+91 8167409664',
    'info@astraivtechnologies.com',
    'Ashoknagar, Kolkata',
    'https://maps.google.com/?q=Ashoknagar,+Kolkata',
    'Astraiv Technologies. All rights reserved.'
) ON CONFLICT DO NOTHING;

INSERT INTO public.social_links (platform, name, url, icon, active, order_index)
VALUES 
    ('twitter', 'Twitter / X', 'https://twitter.com/astraivtech', 'twitter', true, 0),
    ('linkedin', 'LinkedIn', 'https://linkedin.com/company/astraiv', 'linkedin', true, 1),
    ('github', 'GitHub', 'https://github.com/astraiv', 'github', true, 2),
    ('whatsapp', 'WhatsApp', 'https://wa.me/918167409664', 'whatsapp', true, 3),
    ('facebook', 'Facebook', 'https://facebook.com/astraivtechnologies', 'facebook', true, 4),
    ('instagram', 'Instagram', 'https://instagram.com/astraivtech', 'instagram', true, 5)
ON CONFLICT DO NOTHING;
