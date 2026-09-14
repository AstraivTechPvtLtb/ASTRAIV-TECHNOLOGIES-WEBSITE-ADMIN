const { Pool } = require('pg');

const supabasePool = new Pool({
  connectionString: 'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const localPool = new Pool({
  connectionString: 'postgresql://postgres:Akashindia123@localhost:5432/astraiv_tech?schema=public'
});

async function migrateSupabase() {
  const client = await supabasePool.connect();
  try {
    console.log('1. Starting non-destructive schema update on Supabase...');

    // 1. Add missing columns to reviews table
    await client.query(`
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source_submission_id TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS company_name TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS project_name TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS overall_service_rating INTEGER;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS software_quality_rating INTEGER;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS communication_support_rating INTEGER;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 5.00;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS display_rating INTEGER DEFAULT 5;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS liked_most TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS would_recommend TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS improvement_feedback TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS original_review TEXT DEFAULT '';
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_text TEXT DEFAULT '';
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS website_publish_permission TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS can_publish_review BOOLEAN DEFAULT false;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS identity_display_permission TEXT DEFAULT 'Yes';
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
    `);
    console.log('✔ Missing columns added to reviews table in Supabase.');

    // 2. Add unique index on source_submission_id if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'reviews_source_submission_id_key'
        ) THEN
          ALTER TABLE reviews ADD CONSTRAINT reviews_source_submission_id_key UNIQUE (source_submission_id);
        END IF;
      EXCEPTION
        WHEN others THEN NULL;
      END $$;
    `);
    console.log('✔ Unique constraint on source_submission_id ensured.');

    // 3. Populate empty fields for existing Supabase reviews
    await client.query(`
      UPDATE reviews 
      SET 
        review_text = COALESCE(NULLIF(review_text, ''), review, ''),
        original_review = COALESCE(NULLIF(original_review, ''), review, ''),
        average_rating = COALESCE(average_rating, rating, 5.00),
        display_rating = COALESCE(display_rating, rating, 5),
        can_publish_review = (status = 'approved'),
        identity_display_permission = COALESCE(identity_display_permission, 'Yes')
      WHERE review_text = '' OR review_text IS NULL;
    `);
    console.log('✔ Existing Supabase reviews normalized.');

    // 4. Create compliance_settings table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_settings (
        id TEXT PRIMARY KEY,
        iso_number TEXT NOT NULL DEFAULT 'ISO 27001:2022',
        iso_label TEXT NOT NULL DEFAULT 'Certified',
        show_iso_badge BOOLEAN NOT NULL DEFAULT true,
        show_iso_section BOOLEAN NOT NULL DEFAULT true,
        uptime_value TEXT NOT NULL DEFAULT '99.99%',
        uptime_label TEXT NOT NULL DEFAULT 'SERVER UPTIME',
        savings_value TEXT NOT NULL DEFAULT '40%+',
        savings_label TEXT NOT NULL DEFAULT 'INFRASTRUCTURE SAVING',
        actions_value TEXT NOT NULL DEFAULT '10M+',
        actions_label TEXT NOT NULL DEFAULT 'API ACTIONS',
        sla_value TEXT NOT NULL DEFAULT '100%',
        sla_label TEXT NOT NULL DEFAULT 'ON-TIME SLA DELIVERY',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✔ compliance_settings table verified/created.');

    // 5. Insert default compliance row if empty
    await client.query(`
      INSERT INTO compliance_settings (
        id, iso_number, iso_label, show_iso_badge, show_iso_section,
        uptime_value, uptime_label, savings_value, savings_label,
        actions_value, actions_label, sla_value, sla_label
      ) VALUES (
        'default-compliance-id',
        'ISO 27001:2022',
        'Certified',
        true,
        true,
        '99.99%',
        'SERVER UPTIME',
        '40%+',
        'INFRASTRUCTURE SAVING',
        '10M+',
        'API ACTIONS',
        '100%',
        'ON-TIME SLA DELIVERY'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✔ Default compliance record inserted.');

    // 6. Sync reviews from local database into Supabase
    const localRes = await localPool.query('SELECT * FROM reviews');
    console.log(`Found ${localRes.rows.length} reviews in local database. Checking against Supabase...`);

    let syncedCount = 0;
    for (const row of localRes.rows) {
      // Check if review already exists in Supabase by client_name or source_submission_id
      const existing = await client.query(
        'SELECT id FROM reviews WHERE client_name = $1 OR (source_submission_id IS NOT NULL AND source_submission_id = $2)',
        [row.client_name, row.source_submission_id]
      );

      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO reviews (
            id, source_submission_id, review_id, client_name, company_name,
            company, designation, project_name, email,
            overall_service_rating, software_quality_rating, communication_support_rating,
            average_rating, display_rating, rating,
            liked_most, would_recommend, improvement_feedback,
            original_review, review_text, review, image_url,
            website_publish_permission, can_publish_review, identity_display_permission,
            status, featured, admin_note, submitted_at, published_at,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12,
            $13, $14, $15,
            $16, $17, $18,
            $19, $20, $21, $22,
            $23, $24, $25,
            $26, $27, $28, $29, $30,
            $31, $32
          )
        `, [
          row.id, row.source_submission_id, row.review_id, row.client_name, row.company_name,
          row.company, row.designation, row.project_name, row.email,
          row.overall_service_rating, row.software_quality_rating, row.communication_support_rating,
          row.average_rating, row.display_rating, row.rating,
          row.liked_most, row.would_recommend, row.improvement_feedback,
          row.original_review, row.review_text, row.review, row.image_url,
          row.website_publish_permission, row.can_publish_review, row.identity_display_permission,
          row.status, row.featured, row.admin_note, row.submitted_at, row.published_at,
          row.created_at, row.updated_at
        ]);
        syncedCount++;
        console.log(`+ Synced review to Supabase: ${row.client_name} (${row.status})`);
      } else {
        // Update columns for existing record
        await client.query(`
          UPDATE reviews SET
            source_submission_id = COALESCE(reviews.source_submission_id, $2),
            company_name = COALESCE(reviews.company_name, $3),
            company = COALESCE(reviews.company, $4),
            designation = COALESCE(reviews.designation, $5),
            project_name = COALESCE(reviews.project_name, $6),
            email = COALESCE(reviews.email, $7),
            overall_service_rating = COALESCE(reviews.overall_service_rating, $8),
            software_quality_rating = COALESCE(reviews.software_quality_rating, $9),
            communication_support_rating = COALESCE(reviews.communication_support_rating, $10),
            average_rating = COALESCE(reviews.average_rating, $11),
            display_rating = COALESCE(reviews.display_rating, $12),
            original_review = COALESCE(NULLIF(reviews.original_review, ''), $13),
            review_text = COALESCE(NULLIF(reviews.review_text, ''), $14),
            can_publish_review = COALESCE(reviews.can_publish_review, $15),
            identity_display_permission = COALESCE(reviews.identity_display_permission, $16)
          WHERE id = $1
        `, [
          existing.rows[0].id, row.source_submission_id, row.company_name,
          row.company, row.designation, row.project_name, row.email,
          row.overall_service_rating, row.software_quality_rating, row.communication_support_rating,
          row.average_rating, row.display_rating, row.original_review, row.review_text,
          row.can_publish_review, row.identity_display_permission
        ]);
        console.log(`~ Updated columns for existing review in Supabase: ${row.client_name}`);
      }
    }

    const finalRes = await client.query('SELECT count(*) FROM reviews');
    console.log(`\n🎉 DONE! Total reviews in Supabase is now: ${finalRes.rows[0].count}`);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await supabasePool.end();
    await localPool.end();
  }
}

migrateSupabase();
