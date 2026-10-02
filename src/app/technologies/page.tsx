import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getTechnologies } from '@/controllers/technologies.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { TechnologiesTable } from '@/views/tables/technologies-table';

export const dynamic = 'force-dynamic';

export default async function AdminTechnologiesPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: technologies } = await getTechnologies();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Technology Stack & Production Primitives"
        subtitle="Manage engineering languages, frameworks, cloud primitives, databases, and AI runtimes."
        badge={`${technologies.length} Technologies`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <TechnologiesTable initialData={technologies} />
      </main>
    </div>
  );
}
