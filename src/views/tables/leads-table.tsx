'use client';

/**
 * @file admin/src/views/tables/leads-table.tsx
 * @description [VIEW] Enterprise data table and inspector modal for managing Start a Project leads,
 * lifecycle progression (NEW -> QUALIFIED -> CONTACTED -> PROPOSAL -> NEGOTIATION -> WON / LOST),
 * source page attribution, and team assignments.
 */

import { useState } from 'react';
import { AdminLead, LeadLifecycleStatus } from '@/models/types';
import { updateLeadStatus, updateLeadNotes, assignLead, deleteLead } from '@/controllers/leads.controller';
import {
  Search,
  Trash2,
  Mail,
  Phone,
  Building,
  Eye,
  X,
  ExternalLink,
  Target,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Compass,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  initialData: AdminLead[];
  uniqueSourcePages?: string[];
}

const LIFECYCLE_STAGES: Array<{ id: 'all' | LeadLifecycleStatus; label: string; color: string }> = [
  { id: 'all', label: 'All Leads', color: 'bg-slate-800 text-slate-300' },
  { id: 'NEW', label: 'New', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'WON', label: 'Won', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { id: 'LOST', label: 'Lost', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
];

export function LeadsTable({ initialData, uniqueSourcePages = [] }: LeadsTableProps) {
  const [data, setData] = useState<AdminLead[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadLifecycleStatus>('all');
  const [sourcePageFilter, setSourcePageFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<AdminLead | null>(null);
  const [notesEdit, setNotesEdit] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Derive unique source pages from current data if not provided
  const sourcePages =
    uniqueSourcePages.length > 0
      ? uniqueSourcePages
      : Array.from(new Set(data.map((d) => d.source_page).filter(Boolean) as string[]));

  const filteredData = data.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSource =
      sourcePageFilter === 'all' || item.source_page === sourcePageFilter;
    const term = search.toLowerCase().trim();
    const matchesSearch =
      term === '' ||
      item.lead_number.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      (item.company && item.company.toLowerCase().includes(term)) ||
      (item.service_id && item.service_id.toLowerCase().includes(term)) ||
      (item.source_page && item.source_page.toLowerCase().includes(term)) ||
      (item.project_description && item.project_description.toLowerCase().includes(term));

    return matchesStatus && matchesSource && matchesSearch;
  });

  const handleOpenLead = (lead: AdminLead) => {
    setSelectedLead(lead);
    setNotesEdit(lead.notes || '');
  };

  const handleStatusChange = async (id: string, newStatus: LeadLifecycleStatus) => {
    setIsUpdating(true);
    try {
      const res = await updateLeadStatus(id, newStatus);
      if (res.success) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setIsUpdating(true);
    try {
      const res = await updateLeadNotes(selectedLead.id, notesEdit);
      if (res.success) {
        setData((prev) =>
          prev.map((item) =>
            item.id === selectedLead.id ? { ...item, notes: notesEdit } : item
          )
        );
        setSelectedLead((prev) => (prev ? { ...prev, notes: notesEdit } : null));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this lead?')) {
      return;
    }
    setIsUpdating(true);
    try {
      const res = await deleteLead(id);
      if (res.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
        if (selectedLead?.id === id) {
          setSelectedLead(null);
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeClass = (st: LeadLifecycleStatus) => {
    switch (st) {
      case 'NEW':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'QUALIFIED':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'CONTACTED':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'PROPOSAL':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'NEGOTIATION':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'WON':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold';
      case 'LOST':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4">
        {/* Search & Source Page Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by lead #, client, email, service, source page..."
              className="pl-10 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl text-xs"
            />
          </div>

          {/* Source Page Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-semibold shrink-0">Source:</span>
            <select
              value={sourcePageFilter}
              onChange={(e) => setSourcePageFilter(e.target.value)}
              className="h-10 px-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Source Pages ({data.length})</option>
              {sourcePages.map((page) => {
                const count = data.filter((d) => d.source_page === page).length;
                return (
                  <option key={page} value={page}>
                    {page} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Lifecycle Stage Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          {LIFECYCLE_STAGES.map((st) => {
            const count =
              st.id === 'all'
                ? data.length
                : data.filter((d) => d.status === st.id).length;
            const isSelected = statusFilter === st.id;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border',
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <span>{st.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-md font-mono',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Lead #</th>
                <th className="py-3.5 px-4">Client Contact</th>
                <th className="py-3.5 px-4">Discipline & Scope</th>
                <th className="py-3.5 px-4">Source Page</th>
                <th className="py-3.5 px-4">Lifecycle Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No project leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => handleOpenLead(lead)}
                  >
                    {/* Lead Number */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 text-xs">
                          {lead.lead_number}
                        </span>
                      </div>
                    </td>

                    {/* Client Contact */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{lead.name}</span>
                        <span className="text-slate-400 text-xs mt-0.5">{lead.email}</span>
                        {lead.company && (
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {lead.company}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Discipline & Scope */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 max-w-xs">
                        <span className="font-semibold text-slate-200 capitalize truncate">
                          {lead.service_id?.replace(/-/g, ' ') || 'Custom Project'}
                        </span>
                        {lead.budget_range && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {lead.budget_range} • {lead.timeline || 'Flexible'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Source Page Attribution */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lead.source_page) setSourcePageFilter(lead.source_page);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/80 font-mono text-[11px] border border-slate-700/60 transition-colors truncate max-w-[200px]"
                        title={lead.source_page || '/start-project'}
                      >
                        <Compass className="h-3 w-3 text-blue-400 shrink-0" />
                        <span className="truncate">{lead.source_page || '/start-project'}</span>
                      </button>
                    </td>

                    {/* Lifecycle Status */}
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={cn('text-[11px] font-bold uppercase tracking-wider', getStatusBadgeClass(lead.status))}>
                        {lead.status}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-400 whitespace-nowrap text-xs">
                      {new Date(lead.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenLead(lead)}
                          className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lead.id)}
                          className="h-8 px-2 text-slate-400 hover:text-destructive hover:bg-destructive/10"
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

      {/* Detailed Lead Inspector Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-blue-400 bg-blue-500/15 px-3 py-1 rounded-lg border border-blue-500/30">
                    {selectedLead.lead_number}
                  </span>
                  <Badge variant="outline" className={cn('text-xs font-bold uppercase', getStatusBadgeClass(selectedLead.status))}>
                    {selectedLead.status}
                  </Badge>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">{selectedLead.name}</h3>
                <p className="text-xs text-slate-400">
                  Ingested on {new Date(selectedLead.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lifecycle Progression Stepper */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Lead Lifecycle Progression
                </span>
                <span className="text-[11px] text-blue-400 font-mono">
                  Current Stage: {selectedLead.status}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                {(['NEW', 'QUALIFIED', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as LeadLifecycleStatus[]).map((stage) => {
                  const isCurrent = selectedLead.status === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(selectedLead.id, stage)}
                      className={cn(
                        'py-2 px-1 text-center rounded-xl text-[10px] font-bold transition-all border',
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 scale-105'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      )}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact & Organization Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                <a href={`mailto:${selectedLead.email}`} className="text-blue-400 hover:underline font-semibold truncate">
                  {selectedLead.email}
                </a>
              </div>
              {selectedLead.phone && (
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{selectedLead.phone}</span>
                </div>
              )}
              {selectedLead.company && (
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Building className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-semibold">{selectedLead.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-slate-300">
                <Layers className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Service: <strong className="text-white capitalize">{selectedLead.service_id?.replace(/-/g, ' ') || 'Not Specified'}</strong></span>
              </div>
            </div>

            {/* Scope & Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Budget Range</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{selectedLead.budget_range || 'Flexible'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Timeline</span>
                <span className="font-semibold text-slate-200">{selectedLead.timeline || 'Unspecified'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Industry</span>
                <span className="font-semibold text-slate-200 capitalize">{selectedLead.industry_id?.replace(/-/g, ' ') || 'General'}</span>
              </div>
            </div>

            {/* Attribution & Marketing Origin */}
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                Attribution & Lead Source Telemetry
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Source Page:</span>
                  <span className="font-mono font-bold text-blue-300 text-xs break-all">
                    {selectedLead.source_page || '/start-project'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Campaign Parameters:</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {selectedLead.utm_source
                      ? `source: ${selectedLead.utm_source} • medium: ${selectedLead.utm_medium || 'direct'} • campaign: ${selectedLead.utm_campaign || 'none'}`
                      : 'Organic / Direct Inbound'}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Description / Dossier */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Project Requirements & Specifications
              </label>
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
                {selectedLead.project_description || selectedLead.notes || 'No project description submitted.'}
              </div>
            </div>

            {/* Internal Notes Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Internal Administrative Notes
                </label>
                <Button
                  size="xs"
                  onClick={handleSaveNotes}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] h-7 px-2.5 rounded-lg"
                >
                  Save Notes
                </Button>
              </div>
              <textarea
                rows={3}
                value={notesEdit}
                onChange={(e) => setNotesEdit(e.target.value)}
                placeholder="Add private internal notes, call logs, proposal links, or next steps..."
                className="w-full p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(selectedLead.id)}
                  disabled={isUpdating}
                  className="border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs h-9 rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete Lead
                </Button>
              </div>

              <a
                href={`mailto:${selectedLead.email}?subject=Astraiv Technologies - Project Brief [${selectedLead.lead_number}]`}
              >
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 h-9 px-4">
                  <Mail className="h-4 w-4" /> Reply via Email
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
