/**
 * Safe, non-destructive migration script to ensure all Prisma-declared columns exist on `job_openings`.
 * Strictly additive: does NOT drop, truncate, or delete any data.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('[Supabase Safe Migration]: Syncing job_openings columns...');

    await client.query(`
      ALTER TABLE job_openings 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS meta_title TEXT,
      ADD COLUMN IF NOT EXISTS meta_description TEXT;
    `);

    console.log('✔ Checked and ensured columns `status`, `featured`, `meta_title`, `meta_description` exist on `job_openings`.');

    // Update any null values to default
    await client.query(`
      UPDATE job_openings 
      SET 
        status = COALESCE(status, 'active'),
        featured = COALESCE(featured, false)
      WHERE status IS NULL OR featured IS NULL;
    `);

    console.log('✔ Normalized existing rows to clean defaults.');
  } catch (err) {
    console.error('Migration error:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
