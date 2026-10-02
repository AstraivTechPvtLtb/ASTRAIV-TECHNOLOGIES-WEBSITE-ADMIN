const { Client } = require('pg');

async function seed() {
  const client = new Client({
    connectionString:
      'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const now = new Date();
  const expires24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Approve AST-LEAD-1001 (Richard Branson) with 24h validity
  await client.query(
    `UPDATE crm_lead 
     SET portal_approved = TRUE, 
         portal_password = 'Password123', 
         approved_at = $1, 
         first_login_expires_at = $2, 
         has_logged_in = FALSE 
     WHERE lead_number = 'AST-LEAD-1001'`,
    [now, expires24h]
  );
  console.log('Approved AST-LEAD-1001 (Richard Branson)');

  // 2. Ensure AST-LEAD-2026 exists for client@astraiv.com
  const check = await client.query("SELECT id FROM crm_lead WHERE email = 'client@astraiv.com'");
  if (check.rows.length === 0) {
    await client.query(
      `INSERT INTO crm_lead (
        id, lead_number, name, email, phone, company, status, 
        project_description, budget_range, timeline, source_page, 
        portal_approved, portal_password, approved_at, first_login_expires_at, has_logged_in, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'AST-LEAD-2026', 'John Doe (Acme Corp)', 'client@astraiv.com', '+1 555-0199', 'Acme Corporation', 'WON',
        'Enterprise Autonomous AI & Multi-Tenant SaaS Platform build with microservices and PostgreSQL pgvector.',
        '$50,000 - $100,000', '3 Months (Agile)', '/start-project',
        TRUE, 'Password123', $1, $2, FALSE, $1, $1
      )`,
      [now, expires24h]
    );
    console.log('Created and approved AST-LEAD-2026 for client@astraiv.com');
  } else {
    await client.query(
      `UPDATE crm_lead 
       SET lead_number = 'AST-LEAD-2026', 
           portal_approved = TRUE, 
           portal_password = 'Password123', 
           approved_at = $1, 
           first_login_expires_at = $2, 
           has_logged_in = FALSE 
       WHERE email = 'client@astraiv.com'`,
      [now, expires24h]
    );
    console.log('Updated AST-LEAD-2026 for client@astraiv.com');
  }

  // 3. Ensure AST-LEAD-1002 (Melissa Croft) remains UNAPPROVED for testing rejection
  await client.query(
    `UPDATE crm_lead 
     SET portal_approved = FALSE, 
         portal_password = NULL, 
         approved_at = NULL, 
         first_login_expires_at = NULL, 
         has_logged_in = FALSE 
     WHERE lead_number = 'AST-LEAD-1002'`
  );
  console.log('Confirmed AST-LEAD-1002 is UNAPPROVED (for testing rejection).');

  await client.end();
}

seed().catch(console.error);
