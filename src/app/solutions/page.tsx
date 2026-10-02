import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getSolutions } from '@/controllers/solutions.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { SolutionsTable } from '@/views/tables/solutions-table';

export const dynamic = 'force-dynamic';

export default async function AdminSolutionsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: solutions } = await getSolutions();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Solutions & Problem Domains"
        subtitle="Single source of truth for business challenges, architectural approaches, impact metrics, and capabilities."
        badge={`${solutions.length} Solutions`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <SolutionsTable initialData={solutions} />
      </main>
    </div>
  );
}
