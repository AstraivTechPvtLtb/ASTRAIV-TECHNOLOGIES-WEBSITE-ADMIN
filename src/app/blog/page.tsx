import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getBlogArticles } from '@/controllers/blog.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { BlogTable } from '@/views/tables/blog-table';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const { data: posts } = await getBlogArticles();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Blog Articles & Insights"
        subtitle="Manage engineering articles, technology teardowns, and architecture blogs."
        badge={`${posts.length} Articles`}
      />

      <main className="p-6 md:p-8 max-w-7xl">
        <BlogTable initialData={posts} />
      </main>
    </div>
  );
}
