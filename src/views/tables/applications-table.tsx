'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { updateApplicationStatus } from '@/controllers/recruitment.controller';
import type { AdminJobApplication } from '@/controllers/recruitment.controller';
import { Badge } from '@/views/ui/badge';
import { Button } from '@/views/ui/button';

interface ApplicationsTableProps {
  initialData: AdminJobApplication[];
}

export function ApplicationsTable({ initialData }: ApplicationsTableProps) {
  const [data, setData] = useState<AdminJobApplication[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<AdminJobApplication | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = data.filter((app) => {
    const matchesSearch =
      app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase()) ||
      app.role.toLowerCase().includes(search.toLowerCase()) ||
      (app.notes || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: AdminJobApplication['status']) => {
    setUpdatingId(id);
    try {
      const res = await updateApplicationStatus(id, newStatus);
      if (res.success) {
        setData((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
        if (selectedApplication?.id === id) {
          setSelectedApplication((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: AdminJobApplication['status']) => {
    switch (status) {
      case 'hired':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Hired</Badge>;
      case 'interview':
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Interviewing</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Reviewed</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">Archived</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">New Application</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search candidate, role, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'pending', 'reviewed', 'interview', 'hired'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Strict Candidate Privacy & GDPR Protected</span>
        </div>
      </div>

      {/* Applications list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table / List */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              Candidate Ingestion Queue ({filtered.length})
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No job applications match the selected filter.</p>
              </div>
            ) : (
              filtered.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApplication(app)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedApplication?.id === app.id
                      ? 'bg-blue-600/10 border-l-2 border-blue-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{app.applicantName}</span>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-slate-500" />
                        {app.role}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-500" />
                        {app.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          {selectedApplication ? (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedApplication.applicantName}</h3>
                    <p className="text-xs text-blue-400 font-mono mt-0.5">{selectedApplication.role}</p>
                  </div>
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                  <div className="flex items-center gap-2 text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <a href={`mailto:${selectedApplication.email}`} className="hover:underline">
                      {selectedApplication.email}
                    </a>
                  </div>
                </div>

                {selectedApplication.phone && (
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Phone Number</label>
                    <div className="flex items-center gap-2 text-slate-200 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <Phone className="h-4 w-4 text-emerald-400" />
                      <span>{selectedApplication.phone}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Submission Message / Cover Notes</label>
                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                    {selectedApplication.notes || 'No accompanying cover message submitted.'}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Advance Pipeline Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === selectedApplication.id}
                      onClick={() => handleStatusChange(selectedApplication.id, 'reviewed')}
                      className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark Reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === selectedApplication.id}
                      onClick={() => handleStatusChange(selectedApplication.id, 'interview')}
                      className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs"
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Schedule Interview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === selectedApplication.id}
                      onClick={() => handleStatusChange(selectedApplication.id, 'hired')}
                      className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Mark Hired
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === selectedApplication.id}
                      onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                      className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Archive / Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <FileText className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">Select an application</p>
              <p className="text-xs text-slate-600 mt-1">View candidate details and advance candidate stage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
