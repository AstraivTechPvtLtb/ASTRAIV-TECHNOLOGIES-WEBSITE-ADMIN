import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getPricingPlans, getPricingPageSettings } from '@/controllers/pricing.controller';
import { getMediaAssets } from '@/controllers/media.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { PricingTable } from '@/views/tables/pricing-table';

export const dynamic = 'force-dynamic';

export default async function AdminPricingPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const [{ data: plans }, { data: pageSettings }, { data: mediaAssets }] = await Promise.all([
    getPricingPlans(),
    getPricingPageSettings(),
    getMediaAssets(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Engagement Models & Delivery Structures"
        subtitle="Manage structured engagement tiers, scope inclusions, deliverables, quotation CTAs, and the public page hero image."
        badge={`${plans.length} Engagement Models`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <PricingTable
          initialData={plans}
          initialSettings={pageSettings}
          mediaAssets={mediaAssets || []}
        />
      </main>
    </div>
  );
}
