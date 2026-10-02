const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString:
      'postgresql://postgres.cvdiedebmguahkmzkwtd:REDACTED_DATABASE_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const res = await client.query('SELECT id, name, email, role FROM "user" LIMIT 10');
  console.log('Existing users:');
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
