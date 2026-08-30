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

      <main className="p-6 md:p-8 max-w-7xl">
        <EnquiriesTable initialData={enquiries} />
      </main>
    </div>
  );
}
