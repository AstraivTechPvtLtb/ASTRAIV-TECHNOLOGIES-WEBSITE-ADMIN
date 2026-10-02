import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getLegalDocument } from '@/controllers/legal.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { LegalEditor } from '@/views/sections/legal-editor';

export const dynamic = 'force-dynamic';

export default async function AdminTermsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: document } = await getLegalDocument('terms');

  if (!document) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader title="Terms of Service Governance" subtitle="Document record could not be loaded." />
        <main className="p-8 max-w-5xl text-red-400">Failed to load Terms of Service document.</main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Terms of Service Governance"
        subtitle="Master commercial framework, 100% client IP assignments, warranty terms, and SLAs."
        badge={`Live V${document.currentRevision?.versionNumber || 1}`}
      />

      <main className="p-6 md:p-8 max-w-6xl">
        <LegalEditor initialDocument={document} />
      </main>
    </div>
  );
}
