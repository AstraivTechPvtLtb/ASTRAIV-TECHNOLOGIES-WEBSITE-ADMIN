'use client';

/**
 * @file admin/src/views/tables/solutions-table.tsx
 * @description [VIEW] Interactive management table and modal for Solutions (Problems Astraiv Solves).
 */

import { useState } from 'react';
import {
  createSolution,
  updateSolution,
  deleteSolution,
} from '@/controllers/solutions.controller';
import type { AdminSolution } from '@/controllers/solutions.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Tag,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface SolutionsTableProps {
  initialData: AdminSolution[];
}

export function SolutionsTable({ initialData }: SolutionsTableProps) {
  const [data, setData] = useState<AdminSolution[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<AdminSolution | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('intelligent-systems');
  const [categoryLabel, setCategoryLabel] = useState('Artificial Intelligence');
  const [tagline, setTagline] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [metricValue, setMetricValue] = useState('85%');
  const [metricLabel, setMetricLabel] = useState('Manual Overhead Reduced');
  const [featuresText, setFeaturesText] = useState('');
  const [techText, setTechText] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [orderIndex, setOrderIndex] = useState(0);

  const openCreateModal = () => {
    setEditingSolution(null);
    setTitle('');
    setSlug('');
    setCategory('intelligent-systems');
    setCategoryLabel('Artificial Intelligence');
    setTagline('');
    setShortDesc('');
    setFullDesc('');
    setMetricValue('85%');
    setMetricLabel('Efficiency Boost');
    setFeaturesText('');
    setTechText('Python, PyTorch, PostgreSQL, Next.js');
    setStatus('published');
    setOrderIndex(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (sol: AdminSolution) => {
    setEditingSolution(sol);
    setTitle(sol.title);
    setSlug(sol.slug);
    setCategory(sol.category);
    setCategoryLabel(sol.categoryLabel || '');
    setTagline(sol.tagline || '');
    setShortDesc(sol.shortDesc);
    setFullDesc(sol.fullDesc || '');
    setMetricValue(sol.metricValue || '');
    setMetricLabel(sol.metricLabel || '');
    setFeaturesText((sol.features || []).join('\n'));
    setTechText((sol.technologies || []).join(', '));
    setStatus(sol.status);
    setOrderIndex(sol.orderIndex);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !shortDesc.trim()) return;

    setIsSubmitting(true);
    const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const technologies = techText.split(',').map(t => t.trim()).filter(Boolean);

    try {
      if (editingSolution) {
        const res = await updateSolution(editingSolution.id, {
          title,
          slug,
          category,
          categoryLabel,
          tagline,
          shortDesc,
          fullDesc,
          metricValue,
          metricLabel,
          features,
          technologies,
          status,
          orderIndex
        });
        if (res.success) {
          setData(prev => prev.map(s => s.id === editingSolution.id ? {
            ...s,
            title,
            slug,
            category,
            categoryLabel,
            tagline,
            shortDesc,
            fullDesc,
            metricValue,
            metricLabel,
            features,
            technologies,
            status,
            orderIndex
          } : s));
          setIsModalOpen(false);
        }
      } else {
        const res = await createSolution({
          title,
          slug,
          category,
          categoryLabel,
          tagline,
          shortDesc,
          fullDesc,
          metricValue,
          metricLabel,
          features,
          technologies,
          status,
          orderIndex
        });
        if (res.success) {
          // Re-fetch or add
          setData(prev => [...prev, {
            id: 'temp-' + Date.now(),
            title,
            slug,
            category,
            categoryLabel,
            tagline,
            shortDesc,
            fullDesc,
            metricValue,
            metricLabel,
            features,
            technologies,
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
    if (!confirm('Are you sure you want to delete this solution?')) return;
    setDeletingId(id);
    try {
      const res = await deleteSolution(id);
      if (res.success) {
        setData(prev => prev.filter(s => s.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-200">{data.length}</strong> enterprise solutions
          </span>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Solution</span>
        </Button>
      </div>

      {/* Solutions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((sol) => (
          <div
            key={sol.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">{sol.title}</h3>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                      {sol.categoryLabel || sol.category}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block pt-0.5">/solutions/{sol.slug}</span>
                </div>

                <Badge className={sol.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400'}>
                  {sol.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {sol.shortDesc}
              </p>

              {sol.metricValue && (
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{sol.metricLabel || 'Impact Metric'}</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">{sol.metricValue}</span>
                </div>
              )}

              {sol.technologies && sol.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {sol.technologies.slice(0, 4).map((tech, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {tech}
                    </span>
                  ))}
                  {sol.technologies.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-slate-500">+{sol.technologies.length - 4} more</span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <a
                href={`http://localhost:3000/en/solutions/${sol.slug}`}
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
                  onClick={() => openEditModal(sol)}
                  className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(sol.id)}
                  disabled={deletingId === sol.id}
                  className="h-8 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {deletingId === sol.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingSolution ? `Edit Solution: ${editingSolution.title}` : 'Create New Solution'}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Solution Title</label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingSolution) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    placeholder="e.g. AI & Intelligent Systems"
                    className="bg-slate-950 border-slate-800 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. intelligent-systems"
                    className="bg-slate-950 border-slate-800 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category Key</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. intelligent-systems"
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category Display Label</label>
                  <Input
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    placeholder="e.g. Artificial Intelligence"
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Headline Tagline</label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Autonomous AI agents and private model orchestration."
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Brief Overview Description</label>
                  <textarea
                    rows={3}
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="Concise value proposition rendered on overview cards..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Headline Metric Value</label>
                  <Input
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    placeholder="e.g. 85% or 40%+"
                    className="bg-slate-950 border-slate-800 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Metric Description Label</label>
                  <Input
                    value={metricLabel}
                    onChange={(e) => setMetricLabel(e.target.value)}
                    placeholder="e.g. Manual Workflow Reduction"
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Key Capabilities (One per line)</label>
                  <textarea
                    rows={4}
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder="Enterprise pgvector RAG Pipeline&#10;Autonomous Multi-Agent Task Orchestration&#10;Private On-Premise LLM Fine-Tuning"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Associated Technologies (Comma-separated)</label>
                  <Input
                    value={techText}
                    onChange={(e) => setTechText(e.target.value)}
                    placeholder="Python, PyTorch, LangChain, PostgreSQL, Next.js"
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
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Solution'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
