import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getAuditLogs } from '@/controllers/audit.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { ActivityHistoryView } from '@/views/sections/activity-history-view';

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: logs } = await getAuditLogs(100);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Activity History & Audit Logs"
        subtitle="Review security events, publication histories, CMS updates, and system operations with strict attribution."
        badge={`${logs.length} Logged Events`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <ActivityHistoryView initialLogs={logs} />
      </main>
    </div>
  );
}
