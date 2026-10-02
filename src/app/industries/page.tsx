import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getIndustries } from '@/controllers/industries.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { IndustriesTable } from '@/views/tables/industries-table';

export const dynamic = 'force-dynamic';

export default async function AdminIndustriesPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: industries } = await getIndustries();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Industry Verticals & Domains"
        subtitle="Manage compliance benchmarks, domain architectures, challenges, solutions, and domain tech stacks."
        badge={`${industries.length} Verticals`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <IndustriesTable initialData={industries} />
      </main>
    </div>
  );
}
