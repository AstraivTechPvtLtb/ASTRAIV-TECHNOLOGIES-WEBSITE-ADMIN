import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getPricingPlans } from '@/controllers/pricing.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { PricingTable } from '@/views/tables/pricing-table';

export const dynamic = 'force-dynamic';

export default async function AdminPricingPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: plans } = await getPricingPlans();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Pricing & Engagement Models"
        subtitle="Manage plans, pricing tiers, INR & USD rates, feature check-lists, and popular badges synced with the client website."
        badge={`${plans.length} Plans`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <PricingTable initialData={plans} />
      </main>
    </div>
  );
}
