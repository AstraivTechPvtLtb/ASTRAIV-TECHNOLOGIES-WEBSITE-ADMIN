const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/astraiv_db',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const res = await client.query('SELECT id, name, email, role FROM "user" LIMIT 10');
  console.log('Existing users:');
  console.table(res.rows);

  await client.end();
}

main().catch(console.error);
