'use client';

/**
 * @file admin/src/views/tables/enquiries-table.tsx
 * @description [VIEW] Admin data table and inspector modal for managing incoming client leads and inquiries.
 */

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { AdminEnquiry, EnquiryStatus } from '@/models/types';
import { updateEnquiryStatus, deleteEnquiry } from '@/controllers/enquiries.controller';
import { Search, Trash2, Mail, Phone, Building, Eye, X, ExternalLink, FileText, BellRing, Sparkles } from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { cn } from '@/lib/utils';

function playNotificationTone() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Non-blocking for autoplay policies
  }
}

interface EnquiriesTableProps {
  initialData: AdminEnquiry[];
}

export function EnquiriesTable({ initialData }: EnquiriesTableProps) {
  const [data, setData] = useState<AdminEnquiry[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdminEnquiry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [newEnquiryIds, setNewEnquiryIds] = useState<Set<string>>(new Set());
  const [realtimeNotification, setRealtimeNotification] = useState<{
    id: string;
    name: string;
    email: string;
    service: string;
    timestamp: string;
    enquiry: AdminEnquiry;
  } | null>(null);

  // Real-Time Socket.IO Listener for instant inquiry notifications
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';
    let socket: Socket | null = null;

    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 25,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        console.log('[Socket.IO Enquiries Table] Connected to socket hub:', socket?.id);
        setIsSocketConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('[Socket.IO Enquiries Table] Disconnected from socket hub');
        setIsSocketConnected(false);
      });

      socket.on('new_enquiry', (newEnquiry: AdminEnquiry) => {
        if (!newEnquiry || !newEnquiry.id) return;
        console.log('[Socket.IO Enquiries Table] Real-time enquiry received:', newEnquiry);

        // 1. Play auditory chime
        playNotificationTone();

        // 2. Track as new arrival for row badge
        setNewEnquiryIds((prev) => new Set(prev).add(newEnquiry.id));

        // 3. Prepend to table, preventing duplicate keys
        setData((prev) => {
          if (prev.some((item) => item.id === newEnquiry.id)) return prev;
          return [newEnquiry, ...prev];
        });

        // 4. Trigger alert notification banner
        setRealtimeNotification({
          id: newEnquiry.id,
          name: newEnquiry.name,
          email: newEnquiry.email,
          service: newEnquiry.service,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          enquiry: newEnquiry,
        });
      });
    } catch (err) {
      console.warn('[Socket.IO Setup Error]:', err);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

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
      {/* Real-Time Socket.IO Alert Banner */}
      {realtimeNotification && (
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-blue-950 via-slate-900 to-blue-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
              <BellRing className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  New Live Enquiry Alert
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Via Socket.IO
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {realtimeNotification.timestamp}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200 mt-1">
                <strong className="text-white font-bold">{realtimeNotification.name}</strong> submitted an inquiry with service:{' '}
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold text-xs inline-block">
                  {realtimeNotification.service}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              onClick={() => setSelectedEnquiry(realtimeNotification.enquiry)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer h-9 px-3.5"
            >
              <Eye className="h-4 w-4" />
              <span>Read Full Details</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRealtimeNotification(null)}
              className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Socket.IO Connection Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-bold">
            <span className={cn('h-2 w-2 rounded-full', isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
            <span className={isSocketConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {isSocketConnected ? 'Socket.IO Live' : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
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
                    className={cn(
                      'hover:bg-slate-800/40 transition-colors group cursor-pointer',
                      newEnquiryIds.has(item.id) && 'bg-blue-950/20 border-l-4 border-l-blue-500'
                    )}
                    onClick={() => setSelectedEnquiry(item)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.name}</span>
                          {newEnquiryIds.has(item.id) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" />
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs mt-0.5">{item.email}</span>
                        {item.company && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {item.company}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'font-semibold px-2.5 py-1 rounded-lg border text-xs inline-flex items-center gap-1.5',
                          item.service === 'Contact Us'
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 font-bold'
                            : 'text-slate-200 bg-slate-800/70 border-slate-700/50'
                        )}
                      >
                        {item.service === 'Contact Us' && <Mail className="h-3 w-3 text-blue-400" />}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedEnquiry.service?.startsWith('Job Application:')
                    ? 'Job Application & Candidate Profile'
                    : 'Project Message / Requirements'}
                </label>
                {selectedEnquiry.message.includes('Resume Link:') && (
                  (() => {
                    const match = selectedEnquiry.message.match(/Resume Link:\s*(https?:\/\/[^\s]+|\/uploads\/[^\s]+)/);
                    if (match && match[1]) {
                      const url = match[1].startsWith('/') ? `http://localhost:3000${match[1]}` : match[1];
                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-[11px] font-bold transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Resume</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
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

              <a href={`mailto:${selectedEnquiry.email}?subject=Re: Your enquiry with Astraiv Technologies`}>
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
