import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getEnquiries } from '@/controllers/enquiries.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { EnquiriesTable } from '@/views/tables/enquiries-table';

export const dynamic = 'force-dynamic';

export default async function AdminEnquiriesPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: enquiries } = await getEnquiries({ limit: 100 });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Client Enquiries"
        subtitle="Manage prospective client submissions, proposals, and quote requests."
        badge={`${enquiries.length} Records`}
      />

      <main className="p-6 md:p-8 max-w-7xl space-y-6">
        {/* Navigation Switcher between Enquiries and Leads */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Link
            href="/leads"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-xs transition-colors"
          >
            Start a Project Leads
          </Link>
          <Link
            href="/enquiries"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20"
          >
            General Inquiries ({enquiries.length})
          </Link>
        </div>

        <EnquiriesTable initialData={enquiries} />
      </main>
    </div>
  );
}
