import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getReviews } from '@/controllers/reviews.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { ReviewsTable } from '@/views/tables/reviews-table';

export const dynamic = 'force-dynamic';

interface AdminReviewsPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { status, search } = await searchParams;

  const { data: reviews } = await getReviews({
    status: (status as 'all' | 'pending' | 'approved' | 'rejected') || 'all',
    search: search || '',
    limit: 100,
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Client Reviews & Testimonials"
        subtitle="Moderate submitted reviews, manage approval queues, and feature testimonials on the client website."
        badge={`${reviews.length} Submissions`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <ReviewsTable initialData={reviews} />
      </main>
    </div>
  );
}
