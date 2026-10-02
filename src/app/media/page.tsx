import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getMediaAssets } from '@/controllers/media.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { MediaLibraryView } from '@/views/sections/media-library-view';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: assets } = await getMediaAssets();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Media Library & Asset Slot Governance"
        subtitle="Upload guidance, resolution specifications, aspect ratio validation, SVG sanitization, and asset library."
        badge={`${assets.length} Assets`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <MediaLibraryView initialAssets={assets} />
      </main>
    </div>
  );
}
