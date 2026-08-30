import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getProjects } from '@/controllers/projects.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { ProjectsTable } from '@/views/tables/projects-table';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: projects } = await getProjects({ limit: 100 });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Portfolio & Projects"
        subtitle="Manage engineering case studies, featured technologies, and client deliverables."
        badge={`${projects.length} Projects`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <ProjectsTable initialData={projects} />
      </main>
    </div>
  );
}
