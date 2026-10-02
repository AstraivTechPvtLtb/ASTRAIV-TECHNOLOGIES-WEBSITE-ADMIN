import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getSeoAudit, getSlugRedirects } from '@/controllers/seo.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { SeoAuditView } from '@/views/sections/seo-audit-view';

export const dynamic = 'force-dynamic';

export default async function AdminSeoPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const [auditRes, redirectsRes] = await Promise.all([
    getSeoAudit(),
    getSlugRedirects()
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="SEO Governance & Slug Redirect Engine"
        subtitle="Audited OpenGraph metadata completeness, canonical checks, and 301/308 URL redirect rules."
        badge={`${auditRes.summary.completenessPercent}% Audit Readiness`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <SeoAuditView
          summary={auditRes.summary}
          items={auditRes.items}
          redirects={redirectsRes.data}
        />
      </main>
    </div>
  );
}
