import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getPageContent } from '@/controllers/pages.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { PagesManager } from '@/views/sections/pages-manager';

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const [homepage, company, process] = await Promise.all([
    getPageContent('homepage'),
    getPageContent('company'),
    getPageContent('process')
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Standalone Content Pages"
        subtitle="Manage editable copy, hero banners, corporate narratives, and engineering roadmaps across core static pages."
        badge="3 Core Pages"
      />

      <main className="p-6 md:p-8 max-w-6xl">
        <PagesManager
          initialHomepage={homepage.data?.sections}
          initialCompany={company.data?.sections}
          initialProcess={process.data?.sections}
        />
      </main>
    </div>
  );
}
