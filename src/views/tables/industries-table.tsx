'use client';

/**
 * @file admin/src/views/tables/industries-table.tsx
 * @description [VIEW] Interactive management table for Vertical Industries (Healthcare, Fintech, Logistics, SaaS).
 */

import { useState } from 'react';
import {
  createIndustry,
  updateIndustry,
  deleteIndustry,
} from '@/controllers/industries.controller';
import type { AdminIndustry } from '@/controllers/industries.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Building2,
  ExternalLink,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface IndustriesTableProps {
  initialData: AdminIndustry[];
}

export function IndustriesTable({ initialData }: IndustriesTableProps) {
  const [data, setData] = useState<AdminIndustry[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<AdminIndustry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [headline, setHeadline] = useState('');
  const [complianceBadge, setComplianceBadge] = useState('');
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [techText, setTechText] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [orderIndex, setOrderIndex] = useState(0);

  const openCreateModal = () => {
    setEditingIndustry(null);
    setLabel('');
    setSlug('');
    setTagline('');
    setHeadline('');
    setComplianceBadge('ISO 27001 & SOC-2 Ready');
    setChallenge('');
    setSolution('');
    setTechText('Next.js, TypeScript, PostgreSQL, AWS');
    setAccentColor('#3b82f6');
    setStatus('published');
    setOrderIndex(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (ind: AdminIndustry) => {
    setEditingIndustry(ind);
    setLabel(ind.label);
    setSlug(ind.slug);
    setTagline(ind.tagline || '');
    setHeadline(ind.headline || '');
    setComplianceBadge(ind.complianceBadge || '');
    setChallenge(ind.challenge || '');
    setSolution(ind.solution || '');
    setTechText((ind.techStack || []).join(', '));
    setAccentColor(ind.accentColor || '#3b82f6');
    setStatus(ind.status);
    setOrderIndex(ind.orderIndex);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    const techStack = techText.split(',').map(t => t.trim()).filter(Boolean);

    try {
      if (editingIndustry) {
        const res = await updateIndustry(editingIndustry.id, {
          label,
          slug,
          tagline,
          headline,
          complianceBadge,
          challenge,
          solution,
          techStack,
          accentColor,
          status,
          orderIndex
        });
        if (res.success) {
          setData(prev => prev.map(i => i.id === editingIndustry.id ? {
            ...i,
            label,
            slug,
            tagline,
            headline,
            complianceBadge,
            challenge,
            solution,
            techStack,
            accentColor,
            status,
            orderIndex
          } : i));
          setIsModalOpen(false);
        }
      } else {
        const res = await createIndustry({
          label,
          slug,
          tagline,
          headline,
          complianceBadge,
          challenge,
          solution,
          techStack,
          accentColor,
          status,
          orderIndex
        });
        if (res.success) {
          setData(prev => [...prev, {
            id: 'temp-' + Date.now(),
            label,
            slug,
            tagline,
            headline,
            complianceBadge,
            challenge,
            solution,
            techStack,
            accentColor,
            active: true,
            status,
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
    if (!confirm('Are you sure you want to delete this industry?')) return;
    setDeletingId(id);
    try {
      const res = await deleteIndustry(id);
      if (res.success) {
        setData(prev => prev.filter(i => i.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-medium">
          Showing <strong className="text-slate-200">{data.length}</strong> industry verticals
        </span>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Industry</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((ind) => (
          <div
            key={ind.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ind.accentColor || '#3b82f6' }} />
                    <h3 className="text-sm font-bold text-white tracking-tight">{ind.label}</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block pt-0.5">/industries/{ind.slug}</span>
                </div>

                <Badge className={ind.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400'}>
                  {ind.status}
                </Badge>
              </div>

              {ind.complianceBadge && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{ind.complianceBadge}</span>
                </div>
              )}

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {ind.tagline || ind.challenge}
              </p>

              {ind.techStack && ind.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {ind.techStack.map((tech, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <a
                href={`http://localhost:3000/en/industries/${ind.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <span>Live Preview</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditModal(ind)}
                  className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(ind.id)}
                  disabled={deletingId === ind.id}
                  className="h-8 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {deletingId === ind.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingIndustry ? `Edit Industry: ${editingIndustry.label}` : 'Create New Industry'}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Industry Name</label>
                  <Input
                    value={label}
                    onChange={(e) => {
                      setLabel(e.target.value);
                      if (!editingIndustry) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    placeholder="e.g. Healthcare & Life Sciences"
                    className="bg-slate-950 border-slate-800 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. healthcare-life-sciences"
                    className="bg-slate-950 border-slate-800 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Compliance / Regulatory Badge</label>
                  <Input
                    value={complianceBadge}
                    onChange={(e) => setComplianceBadge(e.target.value)}
                    placeholder="e.g. HIPAA & ISO 27001 Compliant"
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Accent Color Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-8 w-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Headline Tagline</label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Secure Medical Informatics & Clinical Data Telemetry"
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Industry Challenge Statement</label>
                  <textarea
                    rows={3}
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    placeholder="Describe specific domain friction and technical hurdles..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Astraiv Solution & Engineering Approach</label>
                  <textarea
                    rows={3}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Describe custom architecture and security solutions..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Domain Technology Stack (Comma-separated)</label>
                  <Input
                    value={techText}
                    onChange={(e) => setTechText(e.target.value)}
                    placeholder="Next.js, TypeScript, PostgreSQL, FastAPI, Docker"
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Publication Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'published' | 'draft' | 'archived')}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (Private)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Display Order</label>
                  <Input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-slate-800 border-slate-700 text-slate-300 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Industry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
