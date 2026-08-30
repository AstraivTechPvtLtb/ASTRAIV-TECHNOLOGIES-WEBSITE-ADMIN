import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { ShieldCheck, Database, Webhook } from 'lucide-react';
import { Card, CardContent } from '@/views/ui/card';
import { Badge } from '@/views/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const webhookSecretConfigured = Boolean(process.env.GOOGLE_SHEET_WEBHOOK_SECRET);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const webhookUrl = `${appUrl}/api/webhooks/google-sheets`;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="System Settings & Integrations"
        subtitle="Review database connections, security status, and Google Sheet synchronization parameters."
      />

      <main className="p-6 md:p-8 space-y-8 max-w-5xl">
        {/* Administrator Profile Card */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Current Session</h3>
                  <p className="text-xs text-slate-400">Authenticated administrator credentials</p>
                </div>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 capitalize">
                {admin.role}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Full Name</span>
                <span className="text-slate-200 font-semibold mt-0.5 block">{admin.fullName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Email</span>
                <span className="text-slate-200 font-semibold mt-0.5 block">{admin.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">User ID</span>
                <span className="text-slate-400 font-mono text-[11px] mt-0.5 block truncate">
                  {admin.id}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database & Infrastructure Status */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Database & Backend Configuration</h3>
                <p className="text-xs text-slate-400">PostgreSQL (Local / Prisma) & Supabase live deployment status</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      Local PostgreSQL (DATABASE_URL)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Primary local database engine via Prisma ORM for all CRUD operations
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                >
                  Active & Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      supabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      Supabase Cloud (NEXT_PUBLIC_SUPABASE_URL)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Cloud deployment provider (Optional for local, required for live deployment)
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    supabaseConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }
                >
                  {supabaseConfigured ? 'Connected' : 'Optional in Local'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Sheet Webhook Sync Integration */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Webhook className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Forms & Sheets Sync Pipeline</h3>
                  <p className="text-xs text-slate-400">Automated ingestion into pending review queue</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  webhookSecretConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }
              >
                {webhookSecretConfigured ? 'Secret Active' : 'Default Secret'}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Webhook Endpoint URL
                </label>
                <div className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-200 text-xs flex items-center justify-between">
                  <span>{webhookUrl}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Google Apps Script Location
                </label>
                <p className="text-slate-400 text-xs mt-1">
                  Paste your Google Apps Script to trigger instant synchronization to this endpoint when form responses are recorded.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
