import { redirect } from 'next/navigation';
import { getAdminUser } from '@/controllers/auth.controller';
import { AdminHeader } from '@/views/layouts/admin-header';
import { ShieldCheck, Building2, Scale, Lock, Globe, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/views/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminLegalIdentityPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/login');
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminHeader
        title="Legal Identity & Compliance Standards"
        subtitle="Corporate registration, jurisdiction, Data Processing Agreement (DPA) parameters, and standards."
        badge="Active Institutional Profile"
      />

      <main className="p-6 md:p-8 max-w-5xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Corporate Entity Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Registered Corporate Entity</h3>
                <span className="text-xs text-slate-400">Commercial entity designation</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Corporate Name</span>
                <span className="text-white font-semibold">Astraiv Technologies</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Headquarters</span>
                <span className="text-white font-semibold">Ashoknagar, Kolkata, India</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Official Legal Email</span>
                <span className="text-blue-400 font-mono">legal@astraivtechnologies.com</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Privacy & DPA Inquiries</span>
                <span className="text-blue-400 font-mono">privacy@astraivtechnologies.com</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Governing Jurisdiction</span>
                <span className="text-white font-semibold">West Bengal, India / International Arbitration</span>
              </div>
            </div>
          </div>

          {/* Compliance Accreditations */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Compliance Benchmarks</h3>
                <span className="text-xs text-slate-400">Active data protection accreditations</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block">ISO 27001:2022 ISMS</span>
                  <span className="text-slate-400 text-[11px]">Information security management & encryption</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Certified</Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block">GDPR & CCPA Compliant</span>
                  <span className="text-slate-400 text-[11px]">Strict data isolation & right to erasure</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block">SOC-2 Type II Attestation Ready</span>
                  <span className="text-slate-400 text-[11px]">Trust Services Criteria & VPC isolation</span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Audited</Badge>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
