const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/astraiv_db',
  ssl: { rejectUnauthorized: false },
});

async function testAdminQuery() {
  console.log('Testing Admin Leads Query...');
  const res = await pool.query(`
    SELECT id, lead_number, name, email, phone, company, status,
           portal_approved, portal_password, approved_at,
           first_login_expires_at, has_logged_in, first_logged_in_at, "createdAt", "updatedAt"
    FROM crm_lead
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);
  console.log(`Successfully fetched ${res.rows.length} leads with portal fields!`);
  console.table(res.rows.map(r => ({
    lead_number: r.lead_number,
    name: r.name,
    email: r.email,
    portal_approved: r.portal_approved,
    has_logged_in: r.has_logged_in,
    expires_at: r.first_login_expires_at ? new Date(r.first_login_expires_at).toISOString() : null,
  })));
  await pool.end();
}

testAdminQuery().catch(console.error);
