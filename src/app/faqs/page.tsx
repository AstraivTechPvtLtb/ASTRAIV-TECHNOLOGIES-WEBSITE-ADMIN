import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getFaqs } from '@/controllers/faqs.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { FaqsTable } from '@/views/tables/faqs-table';

export const dynamic = 'force-dynamic';

export default async function AdminFaqsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: faqs } = await getFaqs();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Frequently Asked Questions (FAQs)"
        subtitle="Manage public answers across general inquiries, services, pricing models, and engineering processes."
        badge={`${faqs.length} Questions`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <FaqsTable initialData={faqs} />
      </main>
    </div>
  );
}
