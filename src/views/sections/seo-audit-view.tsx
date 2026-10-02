'use client';

/**
 * @file admin/src/views/sections/seo-audit-view.tsx
 * @description [VIEW] SEO Governance Auditor & URL Slug Redirects Manager.
 */

import { useState } from 'react';
import {
  createSlugRedirect,
  deleteSlugRedirect,
} from '@/controllers/seo.controller';
import type {
  SeoAuditItem,
  SlugRedirectItem,
} from '@/controllers/seo.controller';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Globe,
  Loader2,
  Sparkles,
  Link2,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface SeoAuditViewProps {
  summary: { total: number; complete: number; missing: number; completenessPercent: number };
  items: SeoAuditItem[];
  redirects: SlugRedirectItem[];
}

export function SeoAuditView({ summary, items, redirects: initialRedirects }: SeoAuditViewProps) {
  const [redirects, setRedirects] = useState<SlugRedirectItem[]>(initialRedirects);
  const [activeTab, setActiveTab] = useState<'audit' | 'redirects'>('audit');
  const [filterMissing, setFilterMissing] = useState(false);

  // New redirect form state
  const [sourcePath, setSourcePath] = useState('');
  const [destinationPath, setDestinationPath] = useState('');
  const [statusCode, setStatusCode] = useState(301);
  const [isCreatingRedirect, setIsCreatingRedirect] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  const displayedItems = filterMissing
    ? items.filter(i => !i.isComplete)
    : items;

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath.trim() || !destinationPath.trim()) return;

    setIsCreatingRedirect(true);
    setRedirectError(null);

    try {
      const res = await createSlugRedirect({
        sourcePath,
        destinationPath,
        statusCode
      });

      if (res.success) {
        setRedirects(prev => [
          {
            id: 'temp-' + Date.now(),
            sourcePath: sourcePath.startsWith('/') ? sourcePath : '/' + sourcePath,
            destinationPath: destinationPath.startsWith('/') ? destinationPath : '/' + destinationPath,
            statusCode,
            entityType: null,
            entityId: null,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          ...prev
        ]);
        setSourcePath('');
        setDestinationPath('');
      } else {
        setRedirectError(res.error || 'Failed to create redirect.');
      }
    } catch (err: unknown) {
      setRedirectError((err as Error)?.message || 'An error occurred.');
    } finally {
      setIsCreatingRedirect(false);
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redirect rule?')) return;
    try {
      const res = await deleteSlugRedirect(id);
      if (res.success) {
        setRedirects(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert((err as Error)?.message || 'Failed to delete redirect.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top SEO Completeness Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">SEO Audit Readiness</span>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-2xl font-black text-white font-mono">{summary.completenessPercent}%</span>
            <Badge className={summary.completenessPercent >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
              {summary.completenessPercent >= 80 ? 'Healthy' : 'Needs Attention'}
            </Badge>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Public Entities</span>
          <span className="text-2xl font-black text-slate-200 font-mono block pt-1">{summary.total}</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-emerald-400 font-medium">Complete Metadata</span>
          <span className="text-2xl font-black text-emerald-400 font-mono block pt-1">{summary.complete}</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-amber-400 font-medium">Missing Meta Titles / Descs</span>
          <span className="text-2xl font-black text-amber-400 font-mono block pt-1">{summary.missing}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Central Metadata Audit ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('redirects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'redirects' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <Link2 className="h-3.5 w-3.5" />
          <span>URL Slug Redirects ({redirects.length})</span>
        </button>
      </div>

      {/* TAB 1: METADATA AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterMissing}
                onChange={(e) => setFilterMissing(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Show Only Incomplete Entities ({summary.missing})</span>
            </label>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
            {displayedItems.map((item, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-900/90 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-800 text-slate-300 text-[10px] uppercase font-mono">
                      {item.entityType}
                    </Badge>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{item.urlPath}</span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] pt-0.5">
                    <span className={item.hasMetaTitle ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.hasMetaTitle ? '✔ Meta Title Set' : '⚠ Missing Meta Title'}
                    </span>
                    <span>•</span>
                    <span className={item.hasMetaDescription ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.hasMetaDescription ? '✔ Meta Description Set' : '⚠ Missing Meta Description'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`http://localhost:3000/en${item.urlPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="View Public Page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SLUG REDIRECTS */}
      {activeTab === 'redirects' && (
        <div className="space-y-6">
          {/* Create Redirect Rule Form */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <span className="text-xs font-bold text-white block">Create URL Slug Redirect Rule</span>

            {redirectError && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs">
                {redirectError}
              </div>
            )}

            <form onSubmit={handleCreateRedirect} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Incoming Old URL Path</label>
                <Input
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  placeholder="e.g. /services/old-name"
                  className="bg-slate-950 border-slate-800 text-xs font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Destination New URL Path</label>
                <Input
                  value={destinationPath}
                  onChange={(e) => setDestinationPath(e.target.value)}
                  placeholder="e.g. /services/new-name"
                  className="bg-slate-950 border-slate-800 text-xs font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">HTTP Status</label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(parseInt(e.target.value) || 301)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2"
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                  <option value={307}>307 Temporary</option>
                  <option value={308}>308 Permanent</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <Button
                  type="submit"
                  disabled={isCreatingRedirect}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl"
                >
                  {isCreatingRedirect ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>

          {/* Redirects List */}
          <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
            {redirects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No custom slug redirects configured.
              </div>
            ) : (
              redirects.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/90 transition-colors">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                      {r.statusCode}
                    </Badge>
                    <span className="text-slate-300 font-bold">{r.sourcePath}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-emerald-400 font-bold">{r.destinationPath}</span>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteRedirect(r.id)}
                    className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
