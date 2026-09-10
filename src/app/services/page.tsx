import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getServices } from '@/controllers/services.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { ServicesTable } from '@/views/tables/services-table';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: services } = await getServices();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Services & Capabilities Catalog"
        subtitle="Single source of truth for the public client website services section and detail pages."
        badge={`${services.length} Offerings`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <ServicesTable initialData={services} />
      </main>
    </div>
  );
}
