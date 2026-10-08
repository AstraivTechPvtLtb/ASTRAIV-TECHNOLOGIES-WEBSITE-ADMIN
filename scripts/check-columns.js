const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/astraiv_db',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const res1 = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'project' ORDER BY ordinal_position"
  );
  console.log('Columns in project:');
  console.table(res1.rows);

  const res2 = await client.query('SELECT * FROM project LIMIT 5');
  console.log('Existing projects:');
  console.table(res2.rows);

  await client.end();
}

main().catch(console.error);
