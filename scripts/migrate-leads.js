const { Client } = require('pg');

async function migrate() {
  const connStr =
    process.argv[2] ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:Akashindia123@localhost:5432/astraiv_tech?schema=public';
  const client = new Client({
    connectionString: connStr,
    ssl: connStr.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  console.log('Connected to PostgreSQL.');

  const alterSql = `
    ALTER TABLE crm_lead 
      ADD COLUMN IF NOT EXISTS lead_number text,
      ADD COLUMN IF NOT EXISTS service_id text,
      ADD COLUMN IF NOT EXISTS solution_id text,
      ADD COLUMN IF NOT EXISTS industry_id text,
      ADD COLUMN IF NOT EXISTS project_description text,
      ADD COLUMN IF NOT EXISTS budget_range text,
      ADD COLUMN IF NOT EXISTS timeline text,
      ADD COLUMN IF NOT EXISTS source_page text,
      ADD COLUMN IF NOT EXISTS utm_source text,
      ADD COLUMN IF NOT EXISTS utm_medium text,
      ADD COLUMN IF NOT EXISTS utm_campaign text,
      ADD COLUMN IF NOT EXISTS assigned_to text;
  `;
  await client.query(alterSql);
  console.log('CRMLead columns added/verified.');

  const res = await client.query('SELECT id, name, status, notes FROM crm_lead ORDER BY "createdAt" ASC');
  let counter = 1001;
  for (const row of res.rows) {
    const leadNum = `AST-LEAD-${counter++}`;
    let normStatus = row.status || 'NEW';
    if (normStatus === 'PROPOSAL_SENT') normStatus = 'PROPOSAL';

    // Parse source page from notes if available
    let sourcePage = '/services/ai-development';
    if (row.notes && row.notes.includes('AI Solution')) {
      sourcePage = '/services/ai-development';
    } else if (row.notes && row.notes.includes('Custom Software')) {
      sourcePage = '/services/custom-software';
    } else if (row.source === 'WEBSITE_START_PROJECT') {
      sourcePage = '/start-project';
    }

    await client.query(
      `UPDATE crm_lead 
       SET lead_number = COALESCE(lead_number, $1),
           status = $2,
           source_page = COALESCE(source_page, $3)
       WHERE id = $4`,
      [leadNum, normStatus, sourcePage, row.id]
    );
  }
  console.log(`Backfilled ${res.rows.length} existing lead records.`);

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'crm_lead_lead_number_key' AND n.nspname = 'public'
      ) THEN
        CREATE UNIQUE INDEX crm_lead_lead_number_key ON crm_lead(lead_number);
      END IF;
    END
    $$;
  `);
  console.log('Unique index on lead_number verified.');

  const check = await client.query('SELECT id, lead_number, name, status, source_page FROM crm_lead');
  console.log('Current leads in DB:', check.rows);

  await client.end();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
