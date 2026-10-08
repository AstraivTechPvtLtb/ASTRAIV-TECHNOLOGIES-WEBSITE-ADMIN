const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/astraiv_db',
  ssl: { rejectUnauthorized: false },
});

async function inspectColumns() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'crm_lead' ORDER BY ordinal_position");
  console.table(res.rows);
  await pool.end();
}

inspectColumns().catch(console.error);
