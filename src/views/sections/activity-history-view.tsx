'use client';

import { useState } from 'react';
import {
  History,
  Search,
  Shield,
  User,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Database,
  Globe,
  Tag,
} from 'lucide-react';
import type { AuditLogItem } from '@/controllers/audit.controller';
import { Badge } from '@/views/ui/badge';

interface ActivityHistoryViewProps {
  initialLogs: AuditLogItem[];
}

export function ActivityHistoryView({ initialLogs }: ActivityHistoryViewProps) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.entityId || '').toLowerCase().includes(search.toLowerCase());

    const matchesFilter = entityFilter === 'all' || log.entityType.toLowerCase() === entityFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('PUBLISH') || act.includes('CREATE')) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{action}</Badge>;
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{action}</Badge>;
    }
    if (act.includes('DELETE') || act.includes('ARCHIVE') || act.includes('UNPUBLISH')) {
      return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">{action}</Badge>;
    }
    return <Badge className="bg-slate-700 text-slate-300 border-slate-600">{action}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header filter controls */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search actions, entities, authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'legal', 'service', 'project', 'media', 'seo'].map((ent) => (
              <button
                key={ent}
                onClick={() => setEntityFilter(ent)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                  entityFilter === ent
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ent}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Immutable Administrative Audit Trail</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-blue-400" />
            Activity Log Stream ({filtered.length} entries)
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No audit log entries recorded yet.</p>
              <p className="text-xs text-slate-600 mt-1">Actions performed across CMS modules will be captured here automatically.</p>
            </div>
          ) : (
            filtered.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getActionBadge(log.action)}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {log.entityType}
                    </span>
                    {log.entityId && (
                      <span className="text-xs text-slate-500 font-mono">
                        ID: {log.entityId}
                      </span>
                    )}
                  </div>

                  {log.details && (
                    <div className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/60 font-mono">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="flex items-center justify-end gap-1.5 text-xs text-slate-300">
                    <User className="h-3 w-3 text-blue-400" />
                    <span>{log.userName || 'Super Admin'}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
