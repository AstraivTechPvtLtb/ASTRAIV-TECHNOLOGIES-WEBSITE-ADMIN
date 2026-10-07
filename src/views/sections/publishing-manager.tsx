'use client';

/**
 * @file admin/src/views/sections/publishing-manager.tsx
 * @description [VIEW] Global Section Visibility, Publishing State & Next.js ISR Cache Purge Manager.
 */

import { useState } from 'react';
import { revalidatePublicCaches } from '@/controllers/publishing.controller';
import {
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Badge } from '@/views/ui/badge';

const CACHE_TARGETS = [
  { path: '/', label: 'Homepage (Root & Hero)' },
  { path: '/services', label: 'Services Catalog (/services)' },
  { path: '/solutions', label: 'Solutions Directory (/solutions)' },
  { path: '/industries', label: 'Industries Directory (/industries)' },
  { path: '/work', label: 'Portfolio & Case Studies (/work)' },
  { path: '/blog', label: 'Engineering Blog & Insights (/blog)' },
  { path: '/faq', label: 'Frequently Asked Questions (/faq)' },
  { path: '/pricing', label: 'Engagement Models (/pricing)' },
  { path: '/careers', label: 'Careers & Recruitment (/careers)' },
  { path: '/privacy', label: 'Privacy Policy (/privacy)' },
  { path: '/terms', label: 'Terms of Service (/terms)' },
];

export function PublishingManager() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>(CACHE_TARGETS.map(t => t.path));
  const [isPurging, setIsPurging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; paths?: string[] } | null>(null);

  const togglePath = (path: string) => {
    setSelectedPaths(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleSelectAll = () => {
    if (selectedPaths.length === CACHE_TARGETS.length) {
      setSelectedPaths([]);
    } else {
      setSelectedPaths(CACHE_TARGETS.map(t => t.path));
    }
  };

  const handlePurge = async () => {
    if (selectedPaths.length === 0) return;

    setIsPurging(true);
    setFeedback(null);

    try {
      const res = await revalidatePublicCaches(selectedPaths);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Successfully revalidated ${res.revalidated.length} public route caches. Changes are instantly live across production CDN nodes.`,
          paths: res.revalidated
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to revalidate caches.'
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: (err as Error)?.message || 'An error occurred during cache purge.'
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">On-Demand ISR Cache Revalidation</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                Instant Edge Purge
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Trigger Next.js incremental static regeneration (ISR) to refresh cached HTML across Cloudflare & Vercel edge networks.
            </p>
          </div>

          <Button
            onClick={handlePurge}
            disabled={isPurging || selectedPaths.length === 0}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            {isPurging ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Revalidate Selected ({selectedPaths.length})</span>
          </Button>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Target Routes Checklist */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white">Public Target Routes for Revalidation</span>
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            {selectedPaths.length === CACHE_TARGETS.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {CACHE_TARGETS.map((target) => {
            const isChecked = selectedPaths.includes(target.path);
            return (
              <label
                key={target.path}
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${isChecked ? 'bg-slate-950 border-blue-500/40 text-white' : 'bg-slate-950/40 border-slate-800/60 text-slate-400'}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePath(target.path)}
                  className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold block truncate">{target.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono block">{target.path}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
