const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/astraiv_db',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- Applying Additive CMS Extensions Migration ---');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "legal_documents" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "current_revision_id" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "legal_revisions" (
        "id" TEXT PRIMARY KEY,
        "document_id" TEXT NOT NULL,
        "document_slug" TEXT NOT NULL,
        "version_number" INTEGER NOT NULL DEFAULT 1,
        "effective_date" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "summary" TEXT,
        "sections" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "status" TEXT NOT NULL DEFAULT 'published',
        "author_id" TEXT,
        "author_name" TEXT,
        "changelog" TEXT,
        "published_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "media_assets" (
        "id" TEXT PRIMARY KEY,
        "url" TEXT NOT NULL,
        "filename" TEXT NOT NULL,
        "mime_type" TEXT NOT NULL,
        "size_bytes" INTEGER NOT NULL,
        "width" INTEGER,
        "height" INTEGER,
        "aspect_ratio" TEXT,
        "alt_text" TEXT,
        "caption" TEXT,
        "focal_point" TEXT,
        "slot" TEXT,
        "is_private" BOOLEAN NOT NULL DEFAULT false,
        "usage_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "page_contents" (
        "id" TEXT PRIMARY KEY,
        "page_key" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "sections" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "meta_title" TEXT,
        "meta_description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'published',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "slug_redirects" (
        "id" TEXT PRIMARY KEY,
        "source_path" TEXT UNIQUE NOT NULL,
        "destination_path" TEXT NOT NULL,
        "status_code" INTEGER NOT NULL DEFAULT 301,
        "entity_type" TEXT,
        "entity_id" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT PRIMARY KEY,
        "action" TEXT NOT NULL,
        "entity_type" TEXT NOT NULL,
        "entity_id" TEXT,
        "user_id" TEXT,
        "user_name" TEXT,
        "details" JSONB DEFAULT '{}'::jsonb,
        "ip_address" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✔ Additive CMS tables created successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
