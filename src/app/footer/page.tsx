import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getFooterData } from '@/controllers/footer.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { FooterManager } from '@/views/sections/footer-manager';

export const dynamic = 'force-dynamic';

export default async function AdminFooterPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { settings, socials } = await getFooterData();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Footer Section"
        subtitle="Manage client website footer socials, phone numbers, email ID, physical address, and map location in real time."
        badge={`${socials.length} Socials`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <FooterManager initialSettings={settings} initialSocials={socials} />
      </main>
    </div>
  );
}

