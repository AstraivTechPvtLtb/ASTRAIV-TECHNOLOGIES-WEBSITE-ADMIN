import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getLegalDocument } from '@/controllers/legal.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { LegalEditor } from '@/views/sections/legal-editor';

export const dynamic = 'force-dynamic';

export default async function AdminPrivacyPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: document } = await getLegalDocument('privacy');

  if (!document) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader title="Privacy Policy Governance" subtitle="Document record could not be loaded." />
        <main className="p-8 max-w-5xl text-red-400">Failed to load Privacy Policy document.</main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Privacy Policy Governance"
        subtitle="Versioned GDPR & ISO 27001 data governance, telemetry rules, and compliance commitments."
        badge={`Live V${document.currentRevision?.versionNumber || 1}`}
      />

      <main className="p-6 md:p-8 max-w-6xl">
        <LegalEditor initialDocument={document} />
      </main>
    </div>
  );
}
