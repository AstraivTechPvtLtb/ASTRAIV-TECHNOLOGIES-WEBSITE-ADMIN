'use client';

/**
 * @file admin/src/views/tables/enquiries-table.tsx
 * @description [VIEW] Admin data table and inspector modal for managing incoming client leads and inquiries.
 */

import { useState } from 'react';
import { AdminEnquiry, EnquiryStatus } from '@/models/types';
import { updateEnquiryStatus, deleteEnquiry } from '@/controllers/enquiries.controller';
import { Search, Trash2, Mail, Phone, Building, Eye, X } from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { cn } from '@/lib/utils';

interface EnquiriesTableProps {
  initialData: AdminEnquiry[];
}

export function EnquiriesTable({ initialData }: EnquiriesTableProps) {
  const [data, setData] = useState<AdminEnquiry[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdminEnquiry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredData = data.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      search.trim() === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      (item.company && item.company.toLowerCase().includes(search.toLowerCase())) ||
      item.service.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    setIsUpdating(true);
    try {
      const res = await updateEnquiryStatus(id, newStatus);
      if (res.success) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      return;
    }
    setIsUpdating(true);
    try {
      const res = await deleteEnquiry(id);
      if (res.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
        if (selectedEnquiry?.id === id) {
          setSelectedEnquiry(null);
        }
      }
    } finally {
      setIsUpdating(false);
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
            placeholder="Search by client, email, company, service..."
            className="pl-10 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'contacted', 'closed', 'spam'] as const).map((st) => (
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
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    No enquiries found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedEnquiry(item)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        <span className="text-slate-400 text-xs mt-0.5">{item.email}</span>
                        {item.company && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {item.company}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-200 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700/50">
                        {item.service}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <Badge
                        variant="outline"
                        className={
                          item.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : item.status === 'contacted'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : item.status === 'closed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEnquiry(item)}
                          className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                  Enquiry Details
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{selectedEnquiry.name}</h3>
                <p className="text-xs text-slate-400">Submitted on {new Date(selectedEnquiry.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="h-4 w-4 text-slate-500" />
                <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-400 hover:underline font-semibold">
                  {selectedEnquiry.email}
                </a>
              </div>
              {selectedEnquiry.phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>{selectedEnquiry.phone}</span>
                </div>
              )}
              {selectedEnquiry.company && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Building className="h-4 w-4 text-slate-500" />
                  <span>{selectedEnquiry.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-bold text-slate-400">Service:</span>
                <span className="font-semibold text-white">{selectedEnquiry.service}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Project Message / Requirements
              </label>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                {selectedEnquiry.message}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Update Status:</span>
                <div className="flex gap-1.5">
                  {(['pending', 'contacted', 'closed', 'spam'] as const).map((st) => (
                    <Button
                      key={st}
                      size="xs"
                      variant={selectedEnquiry.status === st ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(selectedEnquiry.id, st)}
                      disabled={isUpdating}
                      className="h-8 border-slate-800 text-xs capitalize"
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </div>

              <a href={`mailto:${selectedEnquiry.email}?subject=Re: Your enquiry with AstraIV Technologies`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2">
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
