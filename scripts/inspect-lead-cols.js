const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false },
});

async function inspectColumns() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crm_lead' ORDER BY ordinal_position");
  console.table(res.rows);
  await pool.end();
}

inspectColumns().catch(console.error);
