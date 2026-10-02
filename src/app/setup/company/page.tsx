import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getFooterData } from '@/controllers/footer.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { CompanyProfileView } from '@/views/sections/company-profile-view';

export const dynamic = 'force-dynamic';

export default async function AdminCompanySetupPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { settings } = await getFooterData();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Company & Contact Details"
        subtitle="Manage canonical corporate profile, registered business identity, direct inquiry endpoints, and operational hours."
        badge="Canonical Profile"
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <CompanyProfileView initialSettings={settings} />
      </main>
    </div>
  );
}
