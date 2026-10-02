const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.cvdiedebmguahkmzkwtd:REDACTED_DATABASE_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('Tables in DB:');
  for (const table of res.rows) {
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${table.table_name}"`);
      console.log(`  - ${table.table_name}: ${countRes.rows[0].count} rows`);
    } catch (e) {
      console.log(`  - ${table.table_name}: error reading count (${e.message})`);
    }
  }
  client.release();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
