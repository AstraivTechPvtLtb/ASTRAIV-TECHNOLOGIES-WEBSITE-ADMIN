/**
 * sync-data.js
 * Synchronizes the 12 complete production services and social links from Supabase into local PostgreSQL (astraiv_tech).
 */

const { Pool } = require('pg');

async function sync() {
  const localPool = new Pool({
    connectionString: 'postgresql://postgres:Akashindia123@localhost:5432/astraiv_tech?schema=public',
  });
  const supaPool = new Pool({
    connectionString:
      'postgresql://postgres.cvdiedebmguahkmzkwtd:kzT6tRI0Uw8XjGXw@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  });

  console.log('🔄 Fetching production services from Supabase...');
  const { rows: services } = await supaPool.query('SELECT * FROM public.services ORDER BY order_index ASC;');
  console.log(`Found ${services.length} services in Supabase.`);

  console.log('🔄 Syncing services into local database...');
  // Delete existing local services to ensure a clean sync with exact order and slugs
  await localPool.query('DELETE FROM public.services;');

  for (const s of services) {
    await localPool.query(
      `INSERT INTO public.services (id, title, slug, category, short_desc, full_desc, features, badge, icon, active, order_index, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
      [
        s.id,
        s.title,
        s.slug,
        s.category,
        s.short_desc,
        s.full_desc,
        s.features,
        s.badge,
        s.icon,
        s.active,
        s.order_index,
        s.created_at,
        s.updated_at,
      ]
    );
  }
  console.log(`✅ Successfully synced ${services.length} services into local PostgreSQL.`);

  // Sync social links
  console.log('🔄 Fetching social links from Supabase...');
  const { rows: socials } = await supaPool.query('SELECT * FROM public.social_links ORDER BY order_index ASC;');
  if (socials.length > 0) {
    await localPool.query('DELETE FROM public.social_links;');
    for (const soc of socials) {
      await localPool.query(
        `INSERT INTO public.social_links (id, platform, name, url, icon, active, order_index, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [
          soc.id,
          soc.platform,
          soc.name,
          soc.url,
          soc.icon,
          soc.active,
          soc.order_index,
          soc.created_at,
          soc.updated_at,
        ]
      );
    }
    console.log(`✅ Successfully synced ${socials.length} social links into local PostgreSQL.`);
  }

  // Verify
  const { rows: verifyServices } = await localPool.query(
    'SELECT title, slug, category, badge, icon, order_index FROM public.services ORDER BY order_index ASC;'
  );
  console.log('\nVerified local services:');
  console.table(verifyServices);

  await localPool.end();
  await supaPool.end();
}

sync().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
