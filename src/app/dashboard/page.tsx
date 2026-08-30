import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminUser } from '@/controllers/auth.controller';
import { getDashboardStats } from '@/controllers/stats.controller';
import { getEnquiries } from '@/controllers/enquiries.controller';
import { getReviews } from '@/controllers/reviews.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { AdminStatCard } from '@/views/cards/admin-stat-card';
import {
  MessageSquare,
  Star,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Badge } from '@/views/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const [stats, recentEnquiriesRes, pendingReviewsRes] = await Promise.all([
    getDashboardStats(),
    getEnquiries({ limit: 5 }),
    getReviews({ status: 'pending', limit: 5 }),
  ]);

  const recentEnquiries = recentEnquiriesRes.data;
  const pendingReviews = pendingReviewsRes.data;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Dashboard Overview"
        subtitle={`Welcome back, ${admin.fullName}. Here is your live business telemetry.`}
        badge="Live System"
      />

      <main className="p-6 md:p-8 space-y-8 max-w-7xl">
        {/* KPI Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AdminStatCard
            title="Total Enquiries"
            value={stats.totalEnquiries}
            description={`${stats.pendingEnquiries} pending review`}
            icon={MessageSquare}
            iconColor="text-blue-400"
            badge={stats.pendingEnquiries > 0 ? `${stats.pendingEnquiries} New` : undefined}
          />
          <AdminStatCard
            title="Pending Enquiries"
            value={stats.pendingEnquiries}
            description={`${stats.contactedEnquiries} contacted, ${stats.closedEnquiries} closed`}
            icon={Clock}
            iconColor="text-amber-400"
          />
          <AdminStatCard
            title="Total Reviews"
            value={stats.totalReviews}
            description={`${stats.approvedReviews} approved, ${stats.featuredReviews} featured`}
            icon={Star}
            iconColor="text-yellow-400"
            badge={stats.pendingReviews > 0 ? `${stats.pendingReviews} To Approve` : undefined}
          />
          <AdminStatCard
            title="Published Projects"
            value={stats.publishedProjects}
            description={`${stats.draftProjects} drafts in pipeline`}
            icon={FolderKanban}
            iconColor="text-emerald-400"
          />
        </div>

        {/* Action Banners for Pending Approvals */}
        {stats.pendingReviews > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {stats.pendingReviews} New Review{stats.pendingReviews > 1 ? 's' : ''} Awaiting Approval
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submissions from Google Forms require admin approval before becoming visible on the public website.
                </p>
              </div>
            </div>
            <Link href="/reviews?status=pending">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shrink-0">
                Review Submissions
              </Button>
            </Link>
          </div>
        )}

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Enquiries Table Preview */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-4.5 w-4.5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Recent Enquiries</h3>
                </div>
                <Link
                  href="/enquiries"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {recentEnquiries.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No enquiries received yet.</p>
                ) : (
                  recentEnquiries.map((enquiry) => (
                    <div
                      key={enquiry.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{enquiry.name}</h4>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400 truncate">{enquiry.service}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{enquiry.email}</p>
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          enquiry.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] capitalize'
                            : enquiry.status === 'contacted'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] capitalize'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] capitalize'
                        }
                      >
                        {enquiry.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link href="/enquiries">
                <Button variant="outline" className="w-full h-9 border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800">
                  Manage All Enquiries
                </Button>
              </Link>
            </div>
          </div>

          {/* Pending Reviews Preview */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Star className="h-4.5 w-4.5 text-yellow-400" />
                  <h3 className="text-base font-bold text-white">Pending Client Reviews</h3>
                </div>
                <Link
                  href="/reviews"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Review Queue</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {pendingReviews.length === 0 ? (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-slate-400 font-medium">All review submissions have been processed!</p>
                  </div>
                ) : (
                  pendingReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{rev.client_name}</h4>
                          <span className="text-[10px] text-yellow-400 font-bold">★ {rev.rating}/5</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 italic">
                          &ldquo;{rev.review}&rdquo;
                        </p>
                      </div>

                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] shrink-0">
                        Pending
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link href="/reviews">
                <Button variant="outline" className="w-full h-9 border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800">
                  Open Reviews Manager
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
