'use client';

import { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
} from 'lucide-react';
import { updateFooterSettings } from '@/controllers/footer.controller';
import { AdminFooterSettings } from '@/models/types';
import { Button } from '@/views/ui/button';

interface CompanyProfileViewProps {
  initialSettings: AdminFooterSettings;
}

export function CompanyProfileView({ initialSettings }: CompanyProfileViewProps) {
  const [formData, setFormData] = useState({
    brandTagline: initialSettings.brandTagline,
    phone: initialSettings.phone,
    email: initialSettings.email,
    address: initialSettings.address,
    mapUrl: initialSettings.mapUrl || '',
    copyrightText: initialSettings.copyrightText || '',
    tradingName: 'Astraiv Technologies Private Limited',
    jurisdiction: 'Kolkata, West Bengal, India',
    businessHours: 'Monday – Friday: 09:00 AM – 07:00 PM IST',
    emergencySupport: '24/7 Priority SLA for Enterprise Contracts',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await updateFooterSettings({
        brandTagline: formData.brandTagline,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        mapUrl: formData.mapUrl,
        copyrightText: formData.copyrightText,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Company & Contact Details updated and persisted across public site.' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update company settings.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected network error occurred while updating settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Company Credentials */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Canonical Corporate Identity</h3>
            <p className="text-xs text-slate-400">
              Primary brand positioning, legal entity registration, and public footer credentials.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Legal Entity Name</label>
            <input
              type="text"
              value={formData.tradingName}
              onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Governing Jurisdiction</label>
            <input
              type="text"
              value={formData.jurisdiction}
              onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Brand Tagline & Mission Statement</label>
            <textarea
              rows={2}
              value={formData.brandTagline}
              onChange={(e) => setFormData({ ...formData, brandTagline: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Direct Contact Channels */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Direct Inquiries & Headquarters</h3>
            <p className="text-xs text-slate-400">
              Synced across website header badges, contact forms, schema markup, and email signatures.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Official Contact Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Direct Hotline / Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Office Physical Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Google Maps URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="url"
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Operating Hours & Availability */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Business Hours & Support SLA</h3>
            <p className="text-xs text-slate-400">
              Operating hours displayed on public contact pages and SLA escalation notices.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Regular Business Hours</label>
            <input
              type="text"
              value={formData.businessHours}
              onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Enterprise Emergency Support</label>
            <input
              type="text"
              value={formData.emergencySupport}
              onChange={(e) => setFormData({ ...formData, emergencySupport: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Copyright Statement</label>
            <input
              type="text"
              value={formData.copyrightText}
              onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Synchronized with Client Layouts & Structured SEO Data</span>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 shadow-lg shadow-blue-500/20"
        >
          {saving ? (
            'Saving Changes...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Company Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
