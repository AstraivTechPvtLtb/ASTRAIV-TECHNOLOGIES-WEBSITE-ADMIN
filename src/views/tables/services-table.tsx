'use client';

/**
 * @file admin/src/views/tables/services-table.tsx
 * @description [VIEW] Admin data table and modal dialog for managing the services catalog and offerings.
 */

import { useState } from 'react';
import { AdminService } from '@/models/types';
import {
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from '@/controllers/services.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Bot,
  Terminal,
  Cpu,
  Cloud,
  Globe,
  Smartphone,
  Layers,
  GitBranch,
  Settings,
  Database,
  Shuffle,
  HelpCircle,
  ShieldCheck,
  Lock,
  Code2,
  Server,
  Zap,
  BarChart3,
  Workflow,
  Monitor,
  Layout,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

const AVAILABLE_ICONS = [
  { name: 'Bot', icon: Bot, label: 'AI Bot' },
  { name: 'Terminal', icon: Terminal, label: 'Terminal' },
  { name: 'Cpu', icon: Cpu, label: 'Processor' },
  { name: 'Cloud', icon: Cloud, label: 'Cloud' },
  { name: 'Globe', icon: Globe, label: 'Globe' },
  { name: 'Smartphone', icon: Smartphone, label: 'Mobile' },
  { name: 'Layers', icon: Layers, label: 'Layers/UI' },
  { name: 'GitBranch', icon: GitBranch, label: 'DevOps' },
  { name: 'Settings', icon: Settings, label: 'Automation' },
  { name: 'Database', icon: Database, label: 'Database' },
  { name: 'Shuffle', icon: Shuffle, label: 'Transform' },
  { name: 'HelpCircle', icon: HelpCircle, label: 'Consulting' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Security' },
  { name: 'Lock', icon: Lock, label: 'Lock' },
  { name: 'Code2', icon: Code2, label: 'Code' },
  { name: 'Server', icon: Server, label: 'Server' },
  { name: 'Zap', icon: Zap, label: 'Fast/Zap' },
  { name: 'BarChart3', icon: BarChart3, label: 'Analytics' },
  { name: 'Workflow', icon: Workflow, label: 'Workflow' },
  { name: 'Monitor', icon: Monitor, label: 'Monitor' },
  { name: 'Layout', icon: Layout, label: 'Layout' },
];

function renderServiceIcon(name: string, className = 'h-5 w-5') {
  const match = AVAILABLE_ICONS.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (match) {
    const IconComp = match.icon;
    return <IconComp className={className} />;
  }
  return <Cpu className={className} />;
}

interface ServicesTableProps {
  initialData: AdminService[];
}

export function ServicesTable({ initialData }: ServicesTableProps) {
  const [data, setData] = useState<AdminService[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [icon, setIcon] = useState('Cpu');
  const [badge, setBadge] = useState('');
  const [featuresStr, setFeaturesStr] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [displayOrder, setDisplayOrder] = useState(0);

  const openCreateModal = () => {
    setEditingService(null);
    setTitle('');
    setSlug('');
    setCategory('Engineering');
    setShortDesc('');
    setFullDesc('');
    setIcon('Cpu');
    setBadge('');
    setFeaturesStr('');
    setStatus('active');
    setDisplayOrder(data.length + 1);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (srv: AdminService) => {
    setEditingService(srv);
    setTitle(srv.title);
    setSlug(srv.slug);
    setCategory(srv.category || 'Engineering');
    setShortDesc(srv.short_desc || srv.description || '');
    setFullDesc(srv.full_desc || srv.short_desc || '');
    setIcon(srv.icon || 'Cpu');
    setBadge(srv.badge || '');
    setFeaturesStr((srv.features || []).join(', '));
    setStatus(srv.status === 'active' || srv.active ? 'active' : 'draft');
    setDisplayOrder(srv.display_order ?? 0);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingService) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Service Title is required.');
      return;
    }
    if (!shortDesc.trim()) {
      setErrorMsg('Brief Description for the client card is required.');
      return;
    }
    if (!fullDesc.trim()) {
      setErrorMsg('Large Description for the service detail page is required.');
      return;
    }

    setIsSubmitting(true);
    const parsedFeatures = featuresStr
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingService) {
        const res = await updateService(editingService.id, {
          title,
          slug,
          category,
          short_desc: shortDesc,
          full_desc: fullDesc,
          icon,
          badge: badge || undefined,
          features: parsedFeatures,
          status,
          display_order: Number(displayOrder),
        });

        if (res.success) {
          setData((prev) =>
            prev
              .map((s) =>
                s.id === editingService.id
                  ? {
                      ...s,
                      title,
                      slug,
                      category,
                      short_desc: shortDesc,
                      full_desc: fullDesc,
                      description: shortDesc,
                      icon,
                      badge,
                      features: parsedFeatures,
                      status,
                      active: status === 'active',
                      display_order: Number(displayOrder),
                    }
                  : s
              )
              .sort((a, b) => a.display_order - b.display_order)
          );
          setIsModalOpen(false);
        } else {
          setErrorMsg(res.error || 'Failed to update service');
        }
      } else {
        const res = await createService({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category,
          short_desc: shortDesc,
          full_desc: fullDesc,
          icon,
          badge: badge || undefined,
          features: parsedFeatures,
          status,
          display_order: Number(displayOrder),
        });

        if (res.success && res.data) {
          setData((prev) =>
            [...prev, res.data as AdminService].sort(
              (a, b) => a.display_order - b.display_order
            )
          );
          setIsModalOpen(false);
        } else {
          setErrorMsg(res.error || 'Failed to create service');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (srv: AdminService) => {
    const isCurrentlyActive = srv.status === 'active' || srv.active === true;
    const newActiveState = !isCurrentlyActive;
    const newStatus = newActiveState ? 'active' : 'draft';

    // Optimistic UI update
    setData((prev) =>
      prev.map((s) =>
        s.id === srv.id ? { ...s, status: newStatus, active: newActiveState } : s
      )
    );

    const res = await toggleServiceStatus(srv.id, newActiveState);
    if (!res.success) {
      // Revert on error
      setData((prev) =>
        prev.map((s) =>
          s.id === srv.id
            ? { ...s, status: isCurrentlyActive ? 'active' : 'draft', active: isCurrentlyActive }
            : s
        )
      );
      alert('Failed to update service status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will remove it from both the Admin Catalog and Client Website.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await deleteService(id);
      if (res.success) {
        setData((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(res.error || 'Failed to delete service');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = data.filter((s) => s.status === 'active' || s.active).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Services Catalog</span>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              {data.length} Total ({activeCount} Active on Client)
            </Badge>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Single source of truth for the public client website services section and detail pages.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      {/* Services Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4 w-16">Order</th>
              <th className="py-3.5 px-4">Service & Icon</th>
              <th className="py-3.5 px-4">Brief Description (Card)</th>
              <th className="py-3.5 px-4">Large Description (Detail Page)</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No services configured in database. Click &ldquo;Add Service&rdquo; to create one.
                </td>
              </tr>
            ) : (
              data.map((srv) => {
                const isActive = srv.status === 'active' || srv.active === true;
                return (
                  <tr key={srv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-400">
                      #{srv.display_order}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {renderServiceIcon(srv.icon)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            {srv.title}
                            {srv.badge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                {srv.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>/services/{srv.slug}</span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-slate-400">{srv.category || 'Engineering'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-300 leading-relaxed">
                        {srv.short_desc || srv.description || '—'}
                      </p>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 font-mono">
                          {srv.full_desc ? `${srv.full_desc.length} chars` : 'Same as brief'}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                          Detailed
                        </Badge>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(srv)}
                        title={isActive ? 'Click to make Inactive (Hide from website)' : 'Click to make Active (Show on website)'}
                        className="cursor-pointer group flex items-center gap-1.5"
                      >
                        <Badge
                          variant="outline"
                          className={`transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:bg-amber-500/20'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Eye className="h-3 w-3 mr-1 inline" /> Active (Visible)
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1 inline" /> Inactive (Hidden)
                            </>
                          )}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(srv)}
                          className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                          title="Edit Service"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(srv.id, srv.title)}
                          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                          title="Delete Service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  {renderServiceIcon(icon, 'h-5 w-5')}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure service data for the Client Website cards and detail pages.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: SERVICE BASICS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> 1. Service Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Service Title <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. AI Solutions"
                      required
                      className="mt-1.5 bg-slate-950 border-slate-800 text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      URL Slug
                    </label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. ai-solutions"
                      required
                      className="mt-1.5 bg-slate-950 border-slate-800 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Category
                    </label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Engineering, AI & Data, Infrastructure"
                      className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Badge / Tag (Optional)
                    </label>
                    <Input
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="e.g. Popular, Enterprise, Core"
                      className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>

                {/* Icon Selection with Live Preview */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Service Logo / Icon <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-blue-400">Selected: {icon}</span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <Input
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      placeholder="e.g. Bot, Terminal, Cpu, Cloud, Globe..."
                      required
                      className="bg-slate-950 border-slate-800 text-white text-xs font-mono"
                    />
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                      {renderServiceIcon(icon, 'h-5 w-5')}
                    </div>
                  </div>

                  {/* Quick Icon Selector Pills */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Quick Select Icon:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {AVAILABLE_ICONS.map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = icon.toLowerCase() === item.name.toLowerCase();
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setIcon(item.name)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DESCRIPTIONS */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Edit className="h-3.5 w-3.5" /> 2. Content & Descriptions
                </h4>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Brief Description (For Client Service Card) <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">{shortDesc.length} chars</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1.5">
                    Concise text displayed directly on the client card. Keep concise (~1-2 sentences).
                  </p>
                  <textarea
                    rows={2}
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    placeholder="Integration of Large Language Models, custom agents, and predictive analytics into your pipelines."
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Large Description (For Service Detail Page) <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">{fullDesc.length} chars</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-1.5">
                    Comprehensive multi-paragraph content displayed ONLY when visitors click &ldquo;Learn More &rarr;&rdquo;.
                  </p>
                  <textarea
                    rows={7}
                    value={fullDesc}
                    onChange={(e) => setFullDesc(e.target.value)}
                    placeholder="Detailed explanation of this engineering service, architecture, approaches, and capabilities..."
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-sans leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Key Features / Capabilities (Comma-separated)
                  </label>
                  <Input
                    value={featuresStr}
                    onChange={(e) => setFeaturesStr(e.target.value)}
                    placeholder="e.g. Next.js 16 App Router, PostgreSQL & Prisma, Real-Time WebSockets"
                    className="mt-1.5 bg-slate-950 border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              {/* SECTION 3: PUBLISHING & VISIBILITY */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> 3. Publishing & Visibility
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Website Visibility Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'archived')}
                      className="w-full mt-1.5 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">🟢 Active — Visible on Client Website</option>
                      <option value="draft">🟡 Inactive / Draft — Hidden from Client</option>
                      <option value="archived">⚫ Archived — Hidden</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Display Order (Sort Index)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                      className="mt-1.5 bg-slate-950 border-slate-800 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <p className="text-[11px] text-slate-400">
                  {status === 'active' ? (
                    <span className="text-emerald-400 font-medium">● Will immediately appear on client website</span>
                  ) : (
                    <span className="text-amber-400 font-medium">○ Will be saved as hidden draft</span>
                  )}
                </p>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingService ? (
                      'Save Changes'
                    ) : (
                      'Publish Service'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
