import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { getLeads, getLeadsAnalytics } from '@/controllers/leads.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { LeadsTable } from '@/views/tables/leads-table';
import { Target, TrendingUp, Sparkles, Compass } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const [{ data: leads }, analytics] = await Promise.all([
    getLeads({ limit: 100 }),
    getLeadsAnalytics(),
  ]);

  const topSource = analytics.topSourcePages[0]?.page || '/services/ai-development';
  const pipelineCount =
    analytics.statusBreakdown.QUALIFIED +
    analytics.statusBreakdown.CONTACTED +
    analytics.statusBreakdown.PROPOSAL +
    analytics.statusBreakdown.NEGOTIATION;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Project Leads (CRM)"
        subtitle="Manage prospective client scopes, track source page attribution, and advance the 7-stage lead lifecycle."
        badge={`${leads.length} Leads Recorded`}
      />

      <main className="p-6 md:p-8 max-w-7xl space-y-6">
        {/* Navigation Switcher between Enquiries and Leads */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Link
            href="/leads"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20"
          >
            Start a Project Leads ({leads.length})
          </Link>
          <Link
            href="/enquiries"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-xs transition-colors"
          >
            General Inquiries
          </Link>
        </div>

        {/* Lead Analytics KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Leads</span>
              <span className="text-2xl font-black text-white">{analytics.totalLeads}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Active Pipeline</span>
              <span className="text-2xl font-black text-amber-400">{pipelineCount}</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Deals Won</span>
              <span className="text-2xl font-black text-emerald-400">
                {analytics.statusBreakdown.WON} <span className="text-xs font-medium text-slate-400">({analytics.conversionRate}%)</span>
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">Top Source Page</span>
              <span className="text-xs font-mono font-bold text-blue-300 truncate block mt-1" title={topSource}>
                {topSource}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Compass className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Main Leads Table */}
        <LeadsTable
          initialData={leads}
          uniqueSourcePages={analytics.topSourcePages.map((p) => p.page)}
        />
      </main>
    </div>
  );
}
