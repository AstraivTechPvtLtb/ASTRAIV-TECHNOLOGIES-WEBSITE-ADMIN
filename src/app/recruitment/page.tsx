import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getJobOpenings } from '@/controllers/recruitment.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { RecruitmentTable } from '@/views/tables/recruitment-table';

export const dynamic = 'force-dynamic';

export default async function AdminRecruitmentPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: openings } = await getJobOpenings();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Recruitment & Job Openings"
        subtitle="Manage open opportunities, specifications, skills tags, and career listings synced in real time with the client website."
        badge={`${openings.length} Positions`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <RecruitmentTable initialData={openings} />
      </main>
    </div>
  );
}
