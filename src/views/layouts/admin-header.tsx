'use client';

/**
 * @file admin/src/views/layouts/admin-header.tsx
 * @description [VIEW] Top navigation header with page title, database indicator, and security status.
 */

import { ShieldCheck, Database } from 'lucide-react';
import { Badge } from '@/views/ui/badge';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function AdminHeader({ title, subtitle, badge }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 py-4 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800">
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-white">{title}</h1>
          {badge && (
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* System Health indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px]">PostgreSQL Connected</span>
        </div>

        {/* Security indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hidden md:inline text-[11px]">RLS Active</span>
        </div>
      </div>
    </header>
  );
}
