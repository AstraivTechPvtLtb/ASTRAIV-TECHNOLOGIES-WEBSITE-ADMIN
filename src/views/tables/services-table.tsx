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
  reorderService,
  toggleServiceVisibility,
} from '@/controllers/services.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
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
  Code2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

const ICON_OPTIONS = [
  { label: 'Cpu (Custom Software)', value: 'Cpu', icon: Cpu },
  { label: 'Bot (AI Solutions)', value: 'Bot', icon: Bot },
  { label: 'Terminal (Web Applications)', value: 'Terminal', icon: Terminal },
  { label: 'Cloud (Cloud Solutions)', value: 'Cloud', icon: Cloud },
  { label: 'Globe (Website Development)', value: 'Globe', icon: Globe },
  { label: 'Smartphone (Mobile Apps)', value: 'Smartphone', icon: Smartphone },
  { label: 'Layers (UI/UX Design)', value: 'Layers', icon: Layers },
  { label: 'GitBranch (DevOps & CI/CD)', value: 'GitBranch', icon: GitBranch },
  { label: 'Settings (Automation)', value: 'Settings', icon: Settings },
  { label: 'Database (Enterprise Software)', value: 'Database', icon: Database },
  { label: 'Shuffle (Digital Transformation)', value: 'Shuffle', icon: Shuffle },
  { label: 'HelpCircle (IT Consulting)', value: 'HelpCircle', icon: HelpCircle },
  { label: 'Code2 (Generic Engineering)', value: 'Code2', icon: Code2 },
];

function getServiceIconComponent(name?: string) {
  const normalized = (name || '').toLowerCase().trim();
  switch (normalized) {
    case 'bot':
      return Bot;
    case 'terminal':
      return Terminal;
    case 'cloud':
      return Cloud;
    case 'globe':
      return Globe;
    case 'smartphone':
    case 'mobile':
      return Smartphone;
    case 'layers':
      return Layers;
    case 'gitbranch':
    case 'git-branch':
      return GitBranch;
    case 'settings':
      return Settings;
    case 'database':
      return Database;
    case 'shuffle':
      return Shuffle;
    case 'helpcircle':
    case 'help-circle':
      return HelpCircle;
    case 'code2':
    case 'code':
      return Code2;
    case 'cpu':
    default:
      return Cpu;
  }
}

interface ServicesTableProps {
  initialData: AdminService[];
}

export function ServicesTable({ initialData }: ServicesTableProps) {
  const [data, setData] = useState<AdminService[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [badge, setBadge] = useState('');
  const [icon, setIcon] = useState('Cpu');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [displayOrder, setDisplayOrder] = useState(0);

  const openCreateModal = () => {
    setEditingService(null);
    setTitle('');
    setSlug('');
    setCategory('Engineering');
    setBadge('');
    setIcon('Cpu');
    setShortDesc('');
    setFullDesc('');
    setFeaturesText('');
    setStatus('active');
    setDisplayOrder(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (srv: AdminService) => {
    setEditingService(srv);
    setTitle(srv.title);
    setSlug(srv.slug);
    setCategory(srv.category || 'Engineering');
    setBadge(srv.badge || '');
    setIcon(srv.icon || 'Cpu');
    setShortDesc(srv.shortDesc || '');
    setFullDesc(srv.fullDesc || srv.shortDesc || '');
    setFeaturesText((srv.features || []).join('\n'));
    setStatus(srv.status === 'draft' ? 'draft' : 'active');
    setDisplayOrder(srv.display_order);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingService) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedFeatures = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingService) {
        const res = await updateService(editingService.id, {
          title,
          slug,
          category,
          badge: badge.trim() ? badge.trim() : null,
          icon,
          shortDesc,
          fullDesc,
          features: parsedFeatures,
          status,
          display_order: displayOrder,
        });

        if (res.success) {
          setData((prev) =>
            prev.map((s) =>
              s.id === editingService.id
                ? {
                    ...s,
                    title,
                    slug,
                    category,
                    badge: badge.trim() ? badge.trim() : null,
                    icon,
                    shortDesc,
                    fullDesc,
                    features: parsedFeatures,
                    status,
                    display_order: displayOrder,
                  }
                : s
            )
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await createService({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category,
          badge: badge.trim() ? badge.trim() : null,
          icon,
          shortDesc,
          fullDesc,
          features: parsedFeatures,
          status,
          display_order: displayOrder,
        });

        if (res.success && res.data) {
          setData((prev) => [...prev, res.data as AdminService]);
          setIsModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service offering?')) return;
    setIsSubmitting(true);
    try {
      const res = await deleteService(id);
      if (res.success) {
        setData((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = data.findIndex((s) => s.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= data.length) return;

    // Optimistic swap
    const updated = [...data];
    const tempOrder = updated[currentIndex].display_order;
    updated[currentIndex].display_order = updated[targetIndex].display_order;
    updated[targetIndex].display_order = tempOrder;
    [updated[currentIndex], updated[targetIndex]] = [updated[targetIndex], updated[currentIndex]];
    setData(updated);

    await reorderService(id, direction);
  };

  const handleToggleVisibility = async (srv: AdminService) => {
    if (togglingId) return;
    const nextStatus: 'active' | 'draft' = srv.status === 'active' ? 'draft' : 'active';
    setTogglingId(srv.id);

    // Optimistic UI update
    setData((prev) =>
      prev.map((item) =>
        item.id === srv.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const res = await toggleServiceVisibility(srv.id, nextStatus);
      if (!res.success) {
        // Rollback state if server action failed
        setData((prev) =>
          prev.map((item) =>
            item.id === srv.id ? { ...item, status: srv.status } : item
          )
        );
        alert(res.error || 'Failed to toggle service status.');
      }
    } catch {
      setData((prev) =>
        prev.map((item) =>
          item.id === srv.id ? { ...item, status: srv.status } : item
        )
      );
      alert('Network or server error while updating visibility status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white">Services & Capabilities Catalog</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Total configured: <span className="text-blue-400 font-bold">{data.length} services</span> synced in real-time with the client website.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="http://localhost:3000/en/services"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Preview Client Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4"
          >
            <Plus className="h-4 w-4" /> Add New Service
          </Button>
        </div>
      </div>


      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-4 px-4 w-20">Order</th>
              <th className="py-4 px-4">Service & Icon</th>
              <th className="py-4 px-4 max-w-sm">Brief Description (Card)</th>
              <th className="py-4 px-4">Large Description (Detail Page)</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                  No services configured yet in database.
                </td>
              </tr>
            ) : (
              data.map((srv, idx) => {
                const IconComponent = getServiceIconComponent(srv.icon);
                return (
                  <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Order Column */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleReorder(srv.id, 'up')}
                            disabled={idx === 0}
                            className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(srv.id, 'down')}
                            disabled={idx === data.length - 1}
                            className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-slate-300">#{srv.display_order}</span>
                      </div>
                    </td>

                    {/* Service & Icon Column */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tracking-tight">{srv.title}</span>
                            {srv.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-500/30 text-blue-400">
                                {srv.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                            /services/{srv.slug} <span className="text-slate-600">•</span> {srv.category || 'Engineering'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Brief Description (Card) */}
                    <td className="py-4 px-4 text-slate-300 max-w-sm">
                      <p className="line-clamp-2 text-xs leading-relaxed">
                        {srv.shortDesc || 'No brief description provided.'}
                      </p>
                    </td>

                    {/* Large Description (Detail Page) */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">
                          {(srv.fullDesc || '').length} chars
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-800 text-slate-300 border-slate-700"
                        >
                          Detailed
                        </Badge>
                      </div>
                    </td>

                    {/* Status Column (Interactive Client Visibility Toggle) */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(srv)}
                        disabled={togglingId === srv.id}
                        title={
                          srv.status === 'active'
                            ? 'Currently VISIBLE to client. Click to HIDE this service card.'
                            : 'Currently HIDDEN from client. Click to UNHIDE (make visible).'
                        }
                        className={cn(
                          'group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed',
                          srv.status === 'active'
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 hover:border-amber-500/50 shadow-sm shadow-amber-500/10'
                        )}
                      >
                        {togglingId === srv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        ) : srv.status === 'active' ? (
                          <Eye className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:scale-110" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:scale-110" />
                        )}

                        <span>{srv.status === 'active' ? 'Active (Visible)' : 'Draft (Hidden)'}</span>

                        <span
                          className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            srv.status === 'active'
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                              : 'bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          )}
                        />
                      </button>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`http://localhost:3000/en/services/${srv.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="View on Client Website"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(srv)}
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(srv.id)}
                          className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {editingService ? 'Edit Service Offering' : 'Add New Service Offering'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Service Title</label>
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Custom Software"
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">URL Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. custom-software"
                    required
                    className="mt-1 bg-slate-950 border-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Category</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Engineering, AI, Design"
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Badge Tag</label>
                  <Input
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Enterprise, Popular, Core"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full mt-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Brief Description (Card on Homepage)
                  </label>
                  <span className="text-[10px] text-slate-500">{shortDesc.length} chars</span>
                </div>
                <textarea
                  rows={2}
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Short, punchy summary shown on the main homepage service cards..."
                  required
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Large Description (Detail Page Content)
                  </label>
                  <span className="text-[10px] text-slate-500">{fullDesc.length} chars (Markdown supported)</span>
                </div>
                <textarea
                  rows={5}
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                  placeholder="Full markdown-formatted description rendered on /services/[slug] (supports ## Headers, bullet lists, etc.)..."
                  required
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-y focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">
                  Key Features & Highlights (One per line)
                </label>
                <textarea
                  rows={3}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="e.g.&#10;Custom LLM Pipelines&#10;Enterprise RAG Systems&#10;Autonomous Agent Swarms"
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Status (Client Visibility)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'draft')}
                    className="w-full mt-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="active">Active (Visible to Client)</option>
                    <option value="draft">Draft (Hidden from Client)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Display Order</label>
                  <Input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
