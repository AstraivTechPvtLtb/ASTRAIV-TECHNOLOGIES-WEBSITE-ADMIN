import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getFooterSettings, getSocialLinks } from '@/controllers/footer.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { FooterManager } from '@/views/sections/footer-manager';

export const dynamic = 'force-dynamic';

export default async function AdminFooterPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const [{ data: footerSettings }, { data: socialLinks }] = await Promise.all([
    getFooterSettings(),
    getSocialLinks(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Footer & Contact Section"
        subtitle="Manage client website footer branding, social media channel links, official contact info, and legal notices."
        badge={`${socialLinks.length} Social Channels`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <FooterManager
          initialSettings={footerSettings}
          initialSocials={socialLinks}
        />
      </main>
    </div>
  );
}
