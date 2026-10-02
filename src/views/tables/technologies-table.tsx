'use client';

/**
 * @file admin/src/views/tables/technologies-table.tsx
 * @description [VIEW] Interactive management table for Technologies & Tech Stack Catalog.
 */

import { useState } from 'react';
import {
  createTechnology,
  updateTechnology,
  deleteTechnology,
} from '@/controllers/technologies.controller';
import type { AdminTechnology } from '@/controllers/technologies.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Terminal,
  Cpu,
  Globe,
  Database,
  Layers,
  Code2,
  Shield,
  Cloud,
  FileText,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

const TECH_ICONS = [
  { label: 'Globe (Frontend/Web)', value: 'Globe', icon: Globe },
  { label: 'Code2 (React/Language)', value: 'Code2', icon: Code2 },
  { label: 'FileText (TypeScript)', value: 'FileText', icon: FileText },
  { label: 'Terminal (Python/Backend)', value: 'Terminal', icon: Terminal },
  { label: 'Database (PostgreSQL/SQL)', value: 'Database', icon: Database },
  { label: 'Layers (Docker/Containers)', value: 'Layers', icon: Layers },
  { label: 'Cpu (Kubernetes/Compute)', value: 'Cpu', icon: Cpu },
  { label: 'Cloud (AWS/Cloud)', value: 'Cloud', icon: Cloud },
  { label: 'Shield (Cloudflare/Security)', value: 'Shield', icon: Shield },
];

function getTechIcon(name?: string) {
  const norm = (name || '').toLowerCase().trim();
  switch (norm) {
    case 'code2': return Code2;
    case 'filetext': return FileText;
    case 'terminal': return Terminal;
    case 'database': return Database;
    case 'layers': return Layers;
    case 'cpu': return Cpu;
    case 'cloud': return Cloud;
    case 'shield': return Shield;
    case 'globe':
    default: return Globe;
  }
}

interface TechnologiesTableProps {
  initialData: AdminTechnology[];
}

export function TechnologiesTable({ initialData }: TechnologiesTableProps) {
  const [data, setData] = useState<AdminTechnology[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<AdminTechnology | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Frontend & Frameworks');
  const [icon, setIcon] = useState('Globe');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [orderIndex, setOrderIndex] = useState(0);

  const openCreateModal = () => {
    setEditingTech(null);
    setName('');
    setSlug('');
    setCategory('Frontend & Frameworks');
    setIcon('Globe');
    setDescription('');
    setStatus('published');
    setOrderIndex(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (tech: AdminTechnology) => {
    setEditingTech(tech);
    setName(tech.name);
    setSlug(tech.slug);
    setCategory(tech.category);
    setIcon(tech.icon);
    setDescription(tech.description || '');
    setStatus(tech.status);
    setOrderIndex(tech.orderIndex);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingTech) {
        const res = await updateTechnology(editingTech.id, {
          name,
          slug,
          category,
          icon,
          description,
          status,
          orderIndex
        });
        if (res.success) {
          setData(prev => prev.map(t => t.id === editingTech.id ? {
            ...t,
            name,
            slug,
            category,
            icon,
            description,
            status,
            orderIndex
          } : t));
          setIsModalOpen(false);
        }
      } else {
        const res = await createTechnology({
          name,
          slug,
          category,
          icon,
          description,
          status,
          orderIndex
        });
        if (res.success) {
          setData(prev => [...prev, {
            id: 'temp-' + Date.now(),
            name,
            slug,
            category,
            icon,
            description,
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
    if (!confirm('Are you sure you want to delete this technology?')) return;
    setDeletingId(id);
    try {
      const res = await deleteTechnology(id);
      if (res.success) {
        setData(prev => prev.filter(t => t.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-medium">
          Showing <strong className="text-slate-200">{data.length}</strong> core technologies
        </span>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Technology</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((tech) => {
          const IconComp = getTechIcon(tech.icon);
          return (
            <div
              key={tech.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{tech.name}</h3>
                      <span className="text-[11px] text-blue-400 font-mono">{tech.category}</span>
                    </div>
                  </div>

                  <Badge className={tech.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]' : 'bg-slate-800 text-slate-400 text-[10px]'}>
                    {tech.status}
                  </Badge>
                </div>

                {tech.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {tech.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Order: #{tech.orderIndex}</span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(tech)}
                    className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(tech.id)}
                    disabled={deletingId === tech.id}
                    className="h-7 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    {deletingId === tech.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingTech ? `Edit Technology: ${editingTech.name}` : 'Add Technology'}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Technology Name</label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingTech) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  placeholder="e.g. Next.js 16 or PostgreSQL"
                  className="bg-slate-950 border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">URL / Identification Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. nextjs or postgresql"
                  className="bg-slate-950 border-slate-800 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category Group</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="Frontend & Frameworks">Frontend & Frameworks</option>
                  <option value="Languages & Core">Languages & Core</option>
                  <option value="Databases & Persistence">Databases & Persistence</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                  <option value="Mobile Development">Mobile Development</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Icon Symbol</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  {TECH_ICONS.map(ic => (
                    <option key={ic.value} value={ic.value}>{ic.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Architectural Role & Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Production App Router with React Server Components and ISR caching..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Publication Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'published' | 'draft' | 'archived')}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
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
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Technology'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
