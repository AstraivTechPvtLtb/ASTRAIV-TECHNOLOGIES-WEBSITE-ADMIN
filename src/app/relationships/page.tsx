import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getRelationshipGraph } from '@/controllers/relationships.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { RelationshipExplorer } from '@/views/sections/relationship-explorer';

export const dynamic = 'force-dynamic';

export default async function AdminRelationshipsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: graph } = await getRelationshipGraph();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Content Relationships & Graph Explorer"
        subtitle="Manage many-to-many connections across services, solutions, industries, technologies, case studies, and articles."
        badge={`${graph?.entities.length || 0} Entities Connected`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        {graph && <RelationshipExplorer initialGraph={graph} />}
      </main>
    </div>
  );
}
