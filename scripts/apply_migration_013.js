/**
 * @file admin/scripts/apply_migration_013.js
 * @description Executes migration 013_careers_and_roles_architecture.sql against the active database.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '');

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

async function run() {
  console.log('🔄 Applying migration 013_careers_and_roles_architecture.sql...');
  const sqlPath = path.join(__dirname, '../supabase/migrations/013_careers_and_roles_architecture.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Migration 013 applied successfully!');

    // Verify categories
    const catRes = await client.query('SELECT count(*) FROM job_categories');
    console.log(`📊 Job categories count: ${catRes.rows[0].count}`);

    // Verify openings
    const jobRes = await client.query('SELECT id, title, slug, category_id, employment_type, work_mode, geographic_location FROM job_openings');
    console.log('📊 Job openings count:', jobRes.rows.length);
    console.log(jobRes.rows);

    // Verify applications table
    const appRes = await client.query('SELECT count(*) FROM job_applications');
    console.log(`📊 Job applications table exists. Count: ${appRes.rows[0].count}`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

run();
