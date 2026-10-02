const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString:
      'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to PostgreSQL database.');

  await client.query(`
    ALTER TABLE crm_lead ADD COLUMN IF NOT EXISTS portal_approved BOOLEAN DEFAULT FALSE;
    ALTER TABLE crm_lead ADD COLUMN IF NOT EXISTS portal_password TEXT;
    ALTER TABLE crm_lead ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITHOUT TIME ZONE;
    ALTER TABLE crm_lead ADD COLUMN IF NOT EXISTS first_login_expires_at TIMESTAMP WITHOUT TIME ZONE;
    ALTER TABLE crm_lead ADD COLUMN IF NOT EXISTS has_logged_in BOOLEAN DEFAULT FALSE;
    ALTER TABLE crm_lead ADD COLUMN IF NOT EXISTS first_logged_in_at TIMESTAMP WITHOUT TIME ZONE;
  `);
  console.log('Successfully added portal approval and 24h expiration columns to crm_lead table.');

  // Check columns now
  const res = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crm_lead' AND column_name LIKE 'portal%' OR column_name LIKE '%login%' OR column_name = 'approved_at'"
  );
  console.log('Verified portal columns in crm_lead:');
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
