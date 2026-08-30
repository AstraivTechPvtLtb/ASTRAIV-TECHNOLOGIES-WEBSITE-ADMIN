'use client';

/**
 * @file admin/src/views/tables/reviews-table.tsx
 * @description [VIEW] Admin data table and moderation workflow for client feedback and testimonials.
 */

import { useState } from 'react';
import { AdminReview } from '@/models/types';
import {
  approveReview,
  rejectReview,
  toggleFeatureReview,
  updateReview,
  deleteReview,
} from '@/controllers/reviews.controller';
import {
  Search,
  CheckCircle,
  XCircle,
  Star,
  Trash2,
  Edit,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { cn } from '@/lib/utils';

interface ReviewsTableProps {
  initialData: AdminReview[];
}

export function ReviewsTable({ initialData }: ReviewsTableProps) {
  const [data, setData] = useState<AdminReview[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editReview, setEditReview] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editAdminNote, setEditAdminNote] = useState('');

  const filteredData = data.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesFeatured = !featuredOnly || item.featured;
    const matchesSearch =
      search.trim() === '' ||
      item.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.company && item.company.toLowerCase().includes(search.toLowerCase())) ||
      item.review.toLowerCase().includes(search.toLowerCase()) ||
      (item.review_id && item.review_id.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesFeatured && matchesSearch;
  });

  const handleApprove = async (id: string) => {
    setIsUpdating(true);
    try {
      const res = await approveReview(id);
      if (res.success) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
        );
        if (selectedReview?.id === id) {
          setSelectedReview((prev) => (prev ? { ...prev, status: 'approved' } : null));
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsUpdating(true);
    try {
      const res = await rejectReview(id);
      if (res.success) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
        );
        if (selectedReview?.id === id) {
          setSelectedReview((prev) => (prev ? { ...prev, status: 'rejected' } : null));
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFeatured = async (id: string, currentVal: boolean) => {
    setIsUpdating(true);
    try {
      const res = await toggleFeatureReview(id, !currentVal);
      if (res.success) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, featured: !currentVal } : item))
        );
        if (selectedReview?.id === id) {
          setSelectedReview((prev) => (prev ? { ...prev, featured: !currentVal } : null));
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    setIsUpdating(true);
    try {
      const res = await deleteReview(id);
      if (res.success) {
        setData((prev) => prev.filter((item) => item.id !== id));
        if (selectedReview?.id === id) setSelectedReview(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (rev: AdminReview) => {
    setSelectedReview(rev);
    setEditName(rev.client_name);
    setEditCompany(rev.company || '');
    setEditDesignation(rev.designation || '');
    setEditReview(rev.review);
    setEditRating(rev.rating);
    setEditAdminNote(rev.admin_note || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsUpdating(true);
    try {
      const res = await updateReview(selectedReview.id, {
        client_name: editName,
        company: editCompany,
        designation: editDesignation,
        review: editReview,
        rating: editRating,
        admin_note: editAdminNote,
      });

      if (res.success) {
        setData((prev) =>
          prev.map((item) =>
            item.id === selectedReview.id
              ? {
                  ...item,
                  client_name: editName,
                  company: editCompany,
                  designation: editDesignation,
                  review: editReview,
                  rating: editRating,
                  admin_note: editAdminNote,
                }
              : item
          )
        );
        setIsEditing(false);
        setSelectedReview(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, company, content, ID..."
            className="pl-10 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
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

          <Button
            variant={featuredOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeaturedOnly(!featuredOnly)}
            className={cn(
              'h-9 rounded-xl text-xs font-bold gap-1.5',
              featuredOnly
                ? 'bg-yellow-500 text-slate-950 hover:bg-yellow-600'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>Featured Only</span>
          </Button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Review</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    No reviews found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((rev) => (
                  <tr
                    key={rev.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReview(rev)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{rev.client_name}</span>
                          {rev.featured && (
                            <span title="Featured on Website">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs mt-0.5">
                          {rev.designation ? `${rev.designation}, ` : ''}
                          {rev.company || 'Direct Client'}
                        </span>
                        {rev.review_id && (
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {rev.review_id}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-md">
                      <p className="line-clamp-2 text-slate-300 italic">&ldquo;{rev.review}&rdquo;</p>
                      {rev.admin_note && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded w-fit">
                          <span>Note: {rev.admin_note}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center text-yellow-400 font-bold gap-1 text-sm">
                        <span>★</span>
                        <span>{rev.rating}/5</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <Badge
                        variant="outline"
                        className={
                          rev.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                            : rev.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold'
                            : 'bg-red-500/10 text-red-400 border-red-500/30 font-bold'
                        }
                      >
                        {rev.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status !== 'approved' && (
                          <Button
                            size="xs"
                            onClick={() => handleApprove(rev.id)}
                            disabled={isUpdating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2.5 rounded-lg"
                            title="Approve and Publish to Website"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                        )}

                        {rev.status !== 'rejected' && (
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => handleReject(rev.id)}
                            disabled={isUpdating}
                            className="h-7 px-2.5 rounded-lg font-bold"
                            title="Reject review"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleFeatured(rev.id, rev.featured)}
                          className={cn(
                            'h-7 w-7 rounded-lg',
                            rev.featured
                              ? 'text-yellow-400 hover:text-yellow-500 bg-yellow-400/10'
                              : 'text-slate-500 hover:text-yellow-400 hover:bg-slate-800'
                          )}
                          title={rev.featured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(rev)}
                          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                          title="Edit Review Details"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(rev.id)}
                          className="h-7 w-7 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          title="Delete Review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Detail / Edit Modal */}
      {(selectedReview || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-md border border-yellow-400/20">
                  {isEditing ? 'Edit Client Review' : 'Review Details'}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  {selectedReview?.client_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Client Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="mt-1 bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Rating (1 to 5)</label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={editRating}
                      onChange={(e) => setEditRating(parseInt(e.target.value, 10))}
                      required
                      className="mt-1 bg-slate-950 border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Company</label>
                    <Input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Designation</label>
                    <Input
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Review Text</label>
                  <textarea
                    rows={4}
                    value={editReview}
                    onChange={(e) => setEditReview(e.target.value)}
                    required
                    className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-400">Internal Admin Note (Private)</label>
                  <Input
                    value={editAdminNote}
                    onChange={(e) => setEditAdminNote(e.target.value)}
                    placeholder="Private context or verification notes (never displayed publicly)"
                    className="mt-1 bg-slate-950 border-slate-800 text-amber-300"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-slate-800 text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating} className="bg-blue-600 text-white font-bold">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              selectedReview && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      &ldquo;{selectedReview.review}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Source ID: <code className="text-slate-300">{selectedReview.review_id || 'Manual'}</code></span>
                    <span>Rating: <strong className="text-yellow-400 font-bold">★ {selectedReview.rating}/5</strong></span>
                  </div>

                  {selectedReview.admin_note && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      <strong>Admin Note:</strong> {selectedReview.admin_note}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-800 flex justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(selectedReview)}
                      className="border-slate-800 text-slate-300"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Information
                    </Button>

                    <div className="flex gap-2">
                      {selectedReview.status !== 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(selectedReview.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Approve Review
                        </Button>
                      )}
                      {selectedReview.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(selectedReview.id)}
                          className="font-bold"
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
