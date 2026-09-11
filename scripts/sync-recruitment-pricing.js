/**
 * sync-recruitment-pricing.js
 * Creates job_openings and pricing_plans on Supabase production and synchronizes
 * the 3 jobs and 3 pricing tiers from local PostgreSQL (astraiv_tech) into Supabase.
 */

const { Pool } = require('pg');

const localPool = new Pool({
  connectionString: 'postgresql://postgres:Akashindia123@localhost:5432/astraiv_tech?schema=public',
});

const supaPool = new Pool({
  connectionString:
    'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    console.log('🔄 Step 1: Connecting to Supabase production and verifying schema...');

    // 1. Create job_openings table in Supabase
    await supaPool.query(`
      CREATE TABLE IF NOT EXISTS public.job_openings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL DEFAULT 'Engineering',
        type TEXT NOT NULL DEFAULT 'Full-Time / Remote',
        location TEXT NOT NULL DEFAULT 'Remote',
        experience TEXT,
        description TEXT NOT NULL,
        skills TEXT[] NOT NULL DEFAULT '{}',
        salary TEXT,
        apply_url TEXT DEFAULT '/contact',
        active BOOLEAN DEFAULT true NOT NULL,
        order_index INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ job_openings table created/verified on Supabase.');

    // 2. Create pricing_plans table in Supabase
    await supaPool.query(`
      CREATE TABLE IF NOT EXISTS public.pricing_plans (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        badge TEXT,
        is_popular BOOLEAN DEFAULT false NOT NULL,
        price_type TEXT DEFAULT 'fixed' NOT NULL,
        price_monthly_inr DOUBLE PRECISION,
        price_yearly_inr DOUBLE PRECISION,
        price_monthly_usd DOUBLE PRECISION,
        price_yearly_usd DOUBLE PRECISION,
        custom_price_label TEXT DEFAULT 'Custom',
        features TEXT[] NOT NULL DEFAULT '{}',
        button_text TEXT DEFAULT 'Start Building' NOT NULL,
        button_url TEXT DEFAULT '/contact' NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        order_index INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ pricing_plans table created/verified on Supabase.');

    // 3. Enable RLS and setup policies on Supabase
    await supaPool.query(`
      ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'job_openings' AND policyname = 'Allow public read access for active job_openings'
        ) THEN
          CREATE POLICY "Allow public read access for active job_openings" ON public.job_openings
            FOR SELECT USING (true);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'Allow public read access for active pricing_plans'
        ) THEN
          CREATE POLICY "Allow public read access for active pricing_plans" ON public.pricing_plans
            FOR SELECT USING (true);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'job_openings' AND policyname = 'Allow full access for authenticated users on job_openings'
        ) THEN
          CREATE POLICY "Allow full access for authenticated users on job_openings" ON public.job_openings
            FOR ALL USING (auth.role() = 'authenticated');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'pricing_plans' AND policyname = 'Allow full access for authenticated users on pricing_plans'
        ) THEN
          CREATE POLICY "Allow full access for authenticated users on pricing_plans" ON public.pricing_plans
            FOR ALL USING (auth.role() = 'authenticated');
        END IF;
      END $$;
    `);
    console.log('✅ RLS and access policies configured on Supabase.');

    // 4. Fetch records from local database
    console.log('🔄 Step 2: Fetching recruitment and pricing from local PostgreSQL...');
    const { rows: localJobs } = await localPool.query(
      'SELECT * FROM public.job_openings ORDER BY order_index ASC;'
    );
    const { rows: localPlans } = await localPool.query(
      'SELECT * FROM public.pricing_plans ORDER BY order_index ASC;'
    );
    console.log(`Found ${localJobs.length} jobs and ${localPlans.length} plans in local DB.`);

    // 5. Sync Job Openings to Supabase
    console.log('🔄 Step 3: Synchronizing Job Openings into Supabase...');
    for (const j of localJobs) {
      await supaPool.query(
        `INSERT INTO public.job_openings (
          id, title, slug, department, type, location, experience, description, skills, salary, apply_url, active, order_index, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          department = EXCLUDED.department,
          type = EXCLUDED.type,
          location = EXCLUDED.location,
          experience = EXCLUDED.experience,
          description = EXCLUDED.description,
          skills = EXCLUDED.skills,
          salary = EXCLUDED.salary,
          apply_url = EXCLUDED.apply_url,
          active = EXCLUDED.active,
          order_index = EXCLUDED.order_index,
          updated_at = EXCLUDED.updated_at;`,
        [
          j.id,
          j.title,
          j.slug,
          j.department,
          j.type,
          j.location,
          j.experience,
          j.description,
          j.skills,
          j.salary,
          j.apply_url,
          j.active,
          j.order_index,
          j.created_at,
          j.updated_at,
        ]
      );
    }
    console.log(`✅ Synced ${localJobs.length} Job Openings to Supabase.`);

    // 6. Sync Pricing Plans to Supabase
    console.log('🔄 Step 4: Synchronizing Pricing Plans into Supabase...');
    for (const p of localPlans) {
      await supaPool.query(
        `INSERT INTO public.pricing_plans (
          id, name, slug, description, badge, is_popular, price_type,
          price_monthly_inr, price_yearly_inr, price_monthly_usd, price_yearly_usd,
          custom_price_label, features, button_text, button_url, active, order_index, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          badge = EXCLUDED.badge,
          is_popular = EXCLUDED.is_popular,
          price_type = EXCLUDED.price_type,
          price_monthly_inr = EXCLUDED.price_monthly_inr,
          price_yearly_inr = EXCLUDED.price_yearly_inr,
          price_monthly_usd = EXCLUDED.price_monthly_usd,
          price_yearly_usd = EXCLUDED.price_yearly_usd,
          custom_price_label = EXCLUDED.custom_price_label,
          features = EXCLUDED.features,
          button_text = EXCLUDED.button_text,
          button_url = EXCLUDED.button_url,
          active = EXCLUDED.active,
          order_index = EXCLUDED.order_index,
          updated_at = EXCLUDED.updated_at;`,
        [
          p.id,
          p.name,
          p.slug,
          p.description,
          p.badge,
          p.is_popular,
          p.price_type,
          p.price_monthly_inr,
          p.price_yearly_inr,
          p.price_monthly_usd,
          p.price_yearly_usd,
          p.custom_price_label,
          p.features,
          p.button_text,
          p.button_url,
          p.active,
          p.order_index,
          p.created_at,
          p.updated_at,
        ]
      );
    }
    console.log(`✅ Synced ${localPlans.length} Pricing Plans to Supabase.`);

    // 7. Verification check
    console.log('🔄 Step 5: Verifying live data on Supabase...');
    const { rows: verifyJobs } = await supaPool.query('SELECT title, slug, active FROM public.job_openings ORDER BY order_index ASC;');
    console.log('Live Supabase Job Openings:', verifyJobs);

    const { rows: verifyPlans } = await supaPool.query('SELECT name, slug, is_popular, price_monthly_inr FROM public.pricing_plans ORDER BY order_index ASC;');
    console.log('Live Supabase Pricing Plans:', verifyPlans);

    console.log('\n🎉 ALL RECRUITMENT & PRICING DATA SUCCESSFULLY SYNCHRONIZED TO LIVE SUPABASE!');
  } catch (error) {
    console.error('❌ Sync Error:', error);
  } finally {
    await localPool.end();
    await supaPool.end();
  }
}

main();
