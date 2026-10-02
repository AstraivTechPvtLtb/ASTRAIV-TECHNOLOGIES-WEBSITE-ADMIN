import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getJobApplications } from '@/controllers/recruitment.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { ApplicationsTable } from '@/views/tables/applications-table';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: applications, total } = await getJobApplications();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Job Applications Inbox"
        subtitle="Review prospective engineering candidates, verify credentials, and manage recruitment pipeline stages."
        badge={`${total} Applications`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <ApplicationsTable initialData={applications} />
      </main>
    </div>
  );
}
