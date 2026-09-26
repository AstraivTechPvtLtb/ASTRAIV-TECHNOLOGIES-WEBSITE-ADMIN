import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { AnalyticsDashboardView } from '@/views/sections/analytics-dashboard-view';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Website Analytics & Telemetry | Astraiv Admin',
  description: 'Google Analytics 4 traffic data, user engagement, and real-time visitor statistics.',
};

export default async function AdminAnalyticsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Analytics & Telemetry"
        subtitle={`Live Google Analytics 4 telemetry for Astraiv Technologies, ${admin.fullName}.`}
        badge="GA4 Standard"
      />

      <main className="flex-1">
        <AnalyticsDashboardView />
      </main>
    </div>
  );
}
