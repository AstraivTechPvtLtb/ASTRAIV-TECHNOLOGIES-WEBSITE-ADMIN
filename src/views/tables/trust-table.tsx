'use client';

/**
 * @file admin/src/views/tables/trust-table.tsx
 * @description [VIEW] Interactive management table for Trust & Credentials (Awards, Certifications, Partnerships, Claims & Evidence).
 */

import { useState } from 'react';
import {
  createAward,
  updateAward,
  deleteAward,
} from '@/controllers/trust.controller';
import type { AdminAward } from '@/controllers/trust.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Award,
  ShieldCheck,
  Lock,
  Cloud,
  Star,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

const ICONS = [
  { label: 'ShieldCheck (Security / ISO)', value: 'ShieldCheck', icon: ShieldCheck },
  { label: 'Lock (Compliance / SOC-2)', value: 'Lock', icon: Lock },
  { label: 'Cloud (Cloud / AWS Partner)', value: 'Cloud', icon: Cloud },
  { label: 'Star (Review / Ratings)', value: 'Star', icon: Star },
  { label: 'Award (Engineering Honors)', value: 'Award', icon: Award },
];

function getAwardIcon(iconName?: string) {
  const norm = (iconName || '').toLowerCase().trim();
  switch (norm) {
    case 'shieldcheck': return ShieldCheck;
    case 'lock': return Lock;
    case 'cloud': return Cloud;
    case 'star': return Star;
    case 'award':
    default: return Award;
  }
}

interface TrustTableProps {
  initialData: AdminAward[];
}

export function TrustTable({ initialData }: TrustTableProps) {
  const [data, setData] = useState<AdminAward[]>(initialData);
  const [activeTab, setActiveTab] = useState<'all' | 'certification' | 'partnership' | 'recognition' | 'award'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AdminAward | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<AdminAward['type']>('certification');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [year, setYear] = useState('2026');
  const [category, setCategory] = useState('Security Governance');
  const [description, setDescription] = useState('');
  const [achievement, setAchievement] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [verificationLabel, setVerificationLabel] = useState('Verify Certificate');
  const [badgeText, setBadgeText] = useState('ISO 27001:2022');
  const [status, setStatus] = useState<AdminAward['status']>('verified');
  const [icon, setIcon] = useState('ShieldCheck');
  const [highlightsText, setHighlightsText] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

  const openCreateModal = () => {
    setEditingAward(null);
    setType('certification');
    setTitle('');
    setOrganization('');
    setYear('2026');
    setCategory('Compliance');
    setDescription('');
    setAchievement('');
    setVerificationUrl('');
    setVerificationLabel('Verify Certificate');
    setBadgeText('');
    setStatus('verified');
    setIcon('ShieldCheck');
    setHighlightsText('');
    setOrderIndex(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AdminAward) => {
    setEditingAward(item);
    setType(item.type);
    setTitle(item.title);
    setOrganization(item.organization);
    setYear(item.year);
    setCategory(item.category);
    setDescription(item.description);
    setAchievement(item.achievement);
    setVerificationUrl(item.verificationUrl || '');
    setVerificationLabel(item.verificationLabel || 'Verify');
    setBadgeText(item.badgeText);
    setStatus(item.status);
    setIcon(item.icon);
    setHighlightsText((item.highlights || []).join('\n'));
    setOrderIndex(item.orderIndex);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organization.trim()) return;

    setIsSubmitting(true);
    const highlights = highlightsText.split('\n').map(h => h.trim()).filter(Boolean);

    try {
      if (editingAward) {
        const res = await updateAward(editingAward.id, {
          type,
          title,
          organization,
          year,
          category,
          description,
          achievement,
          verificationUrl,
          verificationLabel,
          badgeText,
          status,
          icon,
          highlights,
          orderIndex
        });
        if (res.success) {
          setData(prev => prev.map(a => a.id === editingAward.id ? {
            ...a,
            type,
            title,
            organization,
            year,
            category,
            description,
            achievement,
            verificationUrl,
            verificationLabel,
            badgeText,
            status,
            icon,
            highlights,
            orderIndex
          } : a));
          setIsModalOpen(false);
        }
      } else {
        const res = await createAward({
          type,
          title,
          organization,
          year,
          category,
          description,
          achievement,
          verificationUrl,
          verificationLabel,
          badgeText,
          status,
          icon,
          highlights,
          orderIndex
        });
        if (res.success) {
          setData(prev => [...prev, {
            id: 'temp-' + Date.now(),
            type,
            title,
            organization,
            year,
            category,
            description,
            achievement,
            verificationUrl,
            verificationLabel,
            badgeText,
            status,
            icon,
            highlights,
            published: true,
            featured: true,
            orderIndex,
            createdAt: new Date(),
            updatedAt: new Date()
          }]);
          setIsModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    setDeletingId(id);
    try {
      const res = await deleteAward(id);
      if (res.success) {
        setData(prev => prev.filter(a => a.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = activeTab === 'all' ? data : data.filter(d => d.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: `All (${data.length})` },
            { key: 'certification', label: 'Certifications' },
            { key: 'partnership', label: 'Partnerships' },
            { key: 'recognition', label: 'Recognitions' },
            { key: 'award', label: 'Awards' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Credential</span>
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const IconComp = getAwardIcon(item.icon);
          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{item.title}</h3>
                      <span className="text-[11px] text-slate-400">{item.organization} ({item.year})</span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      item.status === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]'
                        : item.status === 'contractual'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]'
                    }
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="inline-block px-2 py-0.5 rounded-md bg-slate-800/80 text-blue-300 text-[10px] font-mono border border-slate-700/60">
                  {item.badgeText}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {item.highlights && item.highlights.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-slate-400 pt-1">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                {item.verificationUrl ? (
                  <a
                    href={item.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span>{item.verificationLabel || 'Verify Online'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">Internal Accreditation</span>
                )}

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(item)}
                    className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="h-7 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    {deletingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingAward ? 'Edit Trust Credential' : 'Add Trust Credential'}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Credential Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AdminAward['type'])}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="certification">Certification</option>
                    <option value="partnership">Partnership</option>
                    <option value="recognition">Recognition</option>
                    <option value="award">Award</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Factual Claim Verification Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AdminAward['status'])}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="verified">Verified with Documentation</option>
                    <option value="contractual">Active Contractual Partner</option>
                    <option value="illustrative">Illustrative Example</option>
                    <option value="target">Internal Design Target</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Credential Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ISO 27001:2022 Information Security Management"
                  className="bg-slate-950 border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Issuing Organization / Partner</label>
                  <Input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. International Organization for Standardization"
                    className="bg-slate-950 border-slate-800 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Year / Date</label>
                  <Input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="bg-slate-950 border-slate-800 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Display Badge Text</label>
                  <Input
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. ISO 27001:2022"
                    className="bg-slate-950 border-slate-800 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Icon Symbol</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    {ICONS.map(ic => (
                      <option key={ic.value} value={ic.value}>{ic.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Scope & Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed governance description..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Achievement Statement</label>
                <Input
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  placeholder="e.g. Zero non-conformities during third-party audit."
                  className="bg-slate-950 border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Verification URL</label>
                  <Input
                    value={verificationUrl}
                    onChange={(e) => setVerificationUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-slate-950 border-slate-800 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Button Label</label>
                  <Input
                    value={verificationLabel}
                    onChange={(e) => setVerificationLabel(e.target.value)}
                    placeholder="e.g. Verify Certificate"
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Audit Highlights (One per line)</label>
                <textarea
                  rows={3}
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  placeholder="AES-256 Data-at-Rest Encryption&#10;Mandatory 2FA Access Controls&#10;Continuous Vulnerability Scans"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-slate-800 border-slate-700 text-slate-300 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Credential'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
