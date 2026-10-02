import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { SyncStatusView } from '@/views/sections/sync-status-view';

export const dynamic = 'force-dynamic';

export default async function AdminSyncPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Sync & Telemetry Status"
        subtitle="Monitor real-time database connectivity, webhook integrations, GA4 streaming, and edge cache revalidations."
        badge="System Health"
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <SyncStatusView />
      </main>
    </div>
  );
}
