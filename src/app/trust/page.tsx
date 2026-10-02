import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getAwards } from '@/controllers/trust.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { TrustTable } from '@/views/tables/trust-table';

export const dynamic = 'force-dynamic';

export default async function AdminTrustPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: awards } = await getAwards();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Trust & Accreditations (Claims & Evidence)"
        subtitle="Manage ISO certifications, cloud alliances, industry honors, and verifiable factual claims."
        badge={`${awards.length} Credentials`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <TrustTable initialData={awards} />
      </main>
    </div>
  );
}
