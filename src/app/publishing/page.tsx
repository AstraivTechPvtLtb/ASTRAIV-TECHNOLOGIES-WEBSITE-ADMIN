import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { PublishingManager } from '@/views/sections/publishing-manager';

export const dynamic = 'force-dynamic';

export default async function AdminPublishingPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Visibility & On-Demand Publishing"
        subtitle="Trigger Next.js ISR cache revalidations across edge networks and verify live publication status."
        badge="Edge Revalidation Active"
      />

      <main className="p-6 md:p-8 max-w-6xl">
        <PublishingManager />
      </main>
    </div>
  );
}
