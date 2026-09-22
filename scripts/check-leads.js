const { Client } = require('pg');

async function check() {
  const c = new Client({
    connectionString:
      'postgresql://postgres.cvdiedebmguahkmzkwtd:REDACTED_DATABASE_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const r = await c.query(
    'SELECT lead_number, name, email, service_id, source_page, status, utm_source, utm_campaign, "createdAt" FROM crm_lead ORDER BY "createdAt" DESC'
  );
  console.log('Total leads found:', r.rows.length);
  console.table(r.rows);
  await c.end();
}

check().catch(console.error);
