'use client';

/**
 * @file admin/src/views/tables/projects-table.tsx
 * @description [VIEW] Admin data table and modal dialog for managing portfolio case studies.
 */

import { useState } from 'react';
import { AdminProject } from '@/models/types';
import { createProject, updateProject, deleteProject } from '@/controllers/projects.controller';
import { Search, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectsTableProps {
  initialData: AdminProject[];
}

export function ProjectsTable({ initialData }: ProjectsTableProps) {
  const [data, setData] = useState<AdminProject[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [client, setClient] = useState('');
  const [industry, setIndustry] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [featured, setFeatured] = useState(false);
  const [metric, setMetric] = useState('');
  const [metricLabel, setMetricLabel] = useState('');
  const [technologiesInput, setTechnologiesInput] = useState('');

  const filteredData = data.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      search.trim() === '' ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.client && item.client.toLowerCase().includes(search.toLowerCase())) ||
      (item.industry && item.industry.toLowerCase().includes(search.toLowerCase())) ||
      item.slug.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setSlug('');
    setClient('');
    setIndustry('');
    setShortDesc('');
    setDesc('');
    setStatus('draft');
    setFeatured(false);
    setMetric('');
    setMetricLabel('');
    setTechnologiesInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: AdminProject) => {
    setEditingProject(proj);
    setTitle(proj.title);
    setSlug(proj.slug);
    setClient(proj.client || '');
    setIndustry(proj.industry || '');
    setShortDesc(proj.short_description || '');
    setDesc(proj.description || '');
    setStatus(proj.status);
    setFeatured(proj.featured);
    setMetric(proj.metric || '');
    setMetricLabel(proj.metric_label || '');
    setTechnologiesInput(proj.technologies?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const technologies = technologiesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingProject) {
        const res = await updateProject(editingProject.id, {
          title,
          slug,
          client: client || null,
          industry: industry || null,
          short_description: shortDesc || null,
          description: desc || null,
          status,
          featured,
          metric: metric || null,
          metric_label: metricLabel || null,
          technologies,
        });

        if (res.success) {
          setData((prev) =>
            prev.map((item) =>
              item.id === editingProject.id
                ? {
                    ...item,
                    title,
                    slug,
                    client,
                    industry,
                    short_description: shortDesc,
                    description: desc,
                    status,
                    featured,
                    metric,
                    metric_label: metricLabel,
                    technologies,
                  }
                : item
            )
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await createProject({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          client: client || undefined,
          industry: industry || undefined,
          short_description: shortDesc || undefined,
          description: desc || undefined,
          status,
          featured,
          metric: metric || undefined,
          metric_label: metricLabel || undefined,
          technologies,
        });

        if (res.success && res.data) {
          setData((prev) => [res.data as AdminProject, ...prev]);
          setIsModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setIsSubmitting(true);
    try {
      const res = await deleteProject(id);
      if (res.success) {
        setData((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'h-9 rounded-xl text-xs font-bold capitalize',
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                {st}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 rounded-xl flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Metric</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredData.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{proj.title}</span>
                        <span className="text-slate-400 text-xs font-mono">/{proj.slug}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-200 font-medium">{proj.client || '—'}</span>
                    </td>
                    <td className="py-4 px-4">
                      {proj.metric ? (
                        <span className="text-emerald-400 font-bold">{proj.metric}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant="outline"
                        className={
                          proj.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : proj.status === 'draft'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }
                      >
                        {proj.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(proj)}
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(proj.id)}
                          className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Project Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. PulseFit Platform"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">URL Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. pulsefit"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Client Partner</label>
                  <Input
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. PulseFit Global"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Industry</label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. SaaS & HealthTech"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Impact Metric</label>
                  <Input
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="e.g. 65% faster page loads"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Metric Label</label>
                  <Input
                    value={metricLabel}
                    onChange={(e) => setMetricLabel(e.target.value)}
                    placeholder="e.g. Performance Increase"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Technologies (Comma separated)</label>
                <Input
                  value={technologiesInput}
                  onChange={(e) => setTechnologiesInput(e.target.value)}
                  placeholder="Next.js 16, Prisma ORM, PostgreSQL"
                  className="mt-1 bg-slate-950 border-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Short Summary</label>
                <textarea
                  rows={2}
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Full Description</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                    className="w-full mt-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="feat"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <label htmlFor="feat" className="text-xs text-slate-300 font-bold select-none cursor-pointer">
                    Feature on Homepage
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-800 text-slate-400"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-bold">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
