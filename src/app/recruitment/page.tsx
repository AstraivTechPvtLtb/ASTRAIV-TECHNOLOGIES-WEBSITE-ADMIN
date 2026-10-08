import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import {
  getCareersPageContent,
  getJobCategories,
  getJobOpenings,
  getJobApplications,
} from '@/controllers/recruitment.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { CareersRolesManager } from '@/views/tables/careers-roles-manager';

export const dynamic = 'force-dynamic';

export default async function AdminRecruitmentPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const [pageContentRes, categoriesRes, openingsRes, applicationsRes] = await Promise.all([
    getCareersPageContent(),
    getJobCategories(),
    getJobOpenings(),
    getJobApplications(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Careers & Roles Management"
        subtitle="Manage dynamic careers landing content, canonical categories, job openings specifications, recruitment applications inbox, and shared defaults."
        badge={`${openingsRes.data.length} Positions`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <CareersRolesManager
          initialPageContent={pageContentRes.data}
          initialSharedDefaults={pageContentRes.sharedDefaults}
          initialCategories={categoriesRes.data}
          initialOpenings={openingsRes.data}
          initialApplications={applicationsRes.data}
        />
      </main>
    </div>
  );
}
