'use client';

/**
 * @file admin/src/views/tables/reviews-table.tsx
 * @description [VIEW] Admin data table and moderation workflow for client feedback and testimonials.
 */

import { useState, useEffect } from 'react';
import { AdminReview } from '@/models/types';
import {
  approveReview,
  rejectReview,
  toggleFeatureReview,
  updateReview,
  deleteReview,
  ingestFormSubmission,
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
  Globe,
  Lock,
  UserCheck,
  Info,
  Building2,
  Briefcase,
  Mail,
  Calendar,
  PlusCircle,
  Link2,
  Copy,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { cn } from '@/lib/utils';

interface ReviewsTableProps {
  initialData: AdminReview[];
  initialStatus?: string;
}

export function ReviewsTable({ initialData, initialStatus = 'all' }: ReviewsTableProps) {
  const [data, setData] = useState<AdminReview[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (initialStatus) {
      setStatusFilter(initialStatus);
    }
  }, [initialStatus]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [editReviewText, setEditReviewText] = useState('');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Ingest & Setup Modal State
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Ingest Form Fields
  const [ingestName, setIngestName] = useState('');
  const [ingestCompany, setIngestCompany] = useState('');
  const [ingestDesignation, setIngestDesignation] = useState('');
  const [ingestProject, setIngestProject] = useState('');
  const [ingestEmail, setIngestEmail] = useState('');
  const [ingestOverallRating, setIngestOverallRating] = useState('5');
  const [ingestSoftwareRating, setIngestSoftwareRating] = useState('5');
  const [ingestSupportRating, setIngestSupportRating] = useState('5');
  const [ingestTestimonial, setIngestTestimonial] = useState('');
  const [ingestLikedMost, setIngestLikedMost] = useState('');
  const [ingestImprovement, setIngestImprovement] = useState('');
  const [ingestWebPerm, setIngestWebPerm] = useState('Yes');
  const [ingestIdentityPerm, setIngestIdentityPerm] = useState('Yes');

  const handlePrefillSample = () => {
    setIngestName('Marcus Vance');
    setIngestCompany('Apex Capital Partners');
    setIngestDesignation('Chief Technology Officer');
    setIngestProject('Institutional Trading Portal');
    setIngestEmail('marcus@apexcapital.io');
    setIngestOverallRating('5');
    setIngestSoftwareRating('5');
    setIngestSupportRating('5');
    setIngestTestimonial('Astraiv Technologies delivered enterprise-grade architecture with sub-millisecond execution. Their Postgres database design and reactive Next.js interfaces transformed our customer operations.');
    setIngestLikedMost('Technical depth, modern design aesthetics, and proactive engineering speed.');
    setIngestImprovement('Everything exceeded expectations.');
    setIngestWebPerm('Yes');
    setIngestIdentityPerm('Yes');
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestName.trim()) {
      setActionNotice('Validation Error: Client Name is required.');
      return;
    }
    if (!ingestTestimonial.trim()) {
      setActionNotice('Validation Error: Testimonial review text is required.');
      return;
    }

    setIsIngesting(true);
    setActionNotice(null);
    try {
      const res = await ingestFormSubmission({
        clientName: ingestName,
        companyName: ingestCompany,
        designation: ingestDesignation,
        projectName: ingestProject,
        email: ingestEmail,
        overallServiceRating: parseInt(ingestOverallRating, 10) || 5,
        softwareQualityRating: parseInt(ingestSoftwareRating, 10) || 5,
        communicationSupportRating: parseInt(ingestSupportRating, 10) || 5,
        testimonial: ingestTestimonial,
        likedMost: ingestLikedMost,
        wouldRecommend: 'Yes',
        improvementFeedback: ingestImprovement,
        websitePublishPermission: ingestWebPerm,
        identityDisplayPermission: ingestIdentityPerm,
      });

      if (res.success && res.review) {
        const newRev = res.review;
        setData((prev) => [newRev, ...prev.filter((i) => i.id !== newRev.id)]);
        setSelectedReview(newRev);
        setIsIngestOpen(false);
        setStatusFilter('all');
        setActionNotice(res.message || 'Form response successfully ingested into Pending queue!');
        setTimeout(() => setActionNotice(null), 6000);
      } else {
        setActionNotice(res.error || 'Failed to ingest form submission.');
      }
    } finally {
      setIsIngesting(false);
    }
  };

  const copyWebhookSecret = () => {
    navigator.clipboard.writeText('astraiv_gsheet_webhook_secret_2026');
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  const filteredData = data.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesFeatured = !featuredOnly || item.featured;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      item.client_name.toLowerCase().includes(q) ||
      (item.company_name && item.company_name.toLowerCase().includes(q)) ||
      (item.company && item.company.toLowerCase().includes(q)) ||
      (item.project_name && item.project_name.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      item.review_text.toLowerCase().includes(q) ||
      item.original_review.toLowerCase().includes(q) ||
      (item.source_submission_id && item.source_submission_id.toLowerCase().includes(q));

    return matchesStatus && matchesFeatured && matchesSearch;
  });

  const handleApprove = async (id: string) => {
    setIsUpdating(true);
    setActionNotice(null);
    try {
      const res = await approveReview(id);
      if (res.success) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
        );
        if (selectedReview?.id === id) {
          setSelectedReview((prev) => (prev ? { ...prev, status: 'approved' } : null));
        }
        if (res.message) {
          setActionNotice(res.message);
          setTimeout(() => setActionNotice(null), 6000);
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsUpdating(true);
    setActionNotice(null);
    try {
      const res = await rejectReview(id);
      if (res.success) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
        );
        if (selectedReview?.id === id) {
          setSelectedReview((prev) => (prev ? { ...prev, status: 'rejected' } : null));
        }
        if (res.message) {
          setActionNotice(res.message);
          setTimeout(() => setActionNotice(null), 5000);
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
    if (!confirm('Are you sure you want to permanently delete this review record?')) return;
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
    setEditCompany(rev.company_name || rev.company || '');
    setEditDesignation(rev.designation || '');
    setEditProjectName(rev.project_name || '');
    setEditReviewText(rev.review_text || rev.review);
    setEditAdminNote(rev.admin_note || '');
    setEditImageUrl(rev.image_url || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsUpdating(true);
    try {
      const res = await updateReview(selectedReview.id, {
        client_name: editName,
        company_name: editCompany,
        designation: editDesignation,
        project_name: editProjectName,
        review_text: editReviewText,
        admin_note: editAdminNote,
        image_url: editImageUrl || null,
      });

      if (res.success) {
        setData((prev) =>
          prev.map((item) =>
            item.id === selectedReview.id
              ? {
                  ...item,
                  client_name: editName,
                  company_name: editCompany,
                  company: editCompany,
                  designation: editDesignation,
                  project_name: editProjectName,
                  review_text: editReviewText,
                  review: editReviewText,
                  admin_note: editAdminNote,
                  image_url: editImageUrl || null,
                }
              : item
          )
        );
        setIsEditing(false);
        setSelectedReview(null);
        setActionNotice('Review updated successfully.');
        setTimeout(() => setActionNotice(null), 4000);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Info className="h-4 w-4 shrink-0 text-blue-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, company, project, email, review, ID..."
            className="pl-10 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => {
            const count =
              st === 'all'
                ? data.length
                : data.filter((item) => item.status === st).length;

            return (
              <Button
                key={st}
                variant={statusFilter === st ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(st);
                  if (typeof window !== 'undefined') {
                    const newUrl = st === 'all' ? '/reviews' : `/reviews?status=${st}`;
                    window.history.replaceState(null, '', newUrl);
                  }
                }}
                className={cn(
                  'h-9 rounded-xl text-xs font-bold capitalize gap-1.5',
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <span>{st}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors',
                    statusFilter === st
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  )}
                >
                  {count}
                </span>
              </Button>
            );
          })}

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
            <span>Featured</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px] font-semibold',
                featuredOnly
                  ? 'bg-yellow-600 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              )}
            >
              {data.filter((item) => item.featured).length}
            </span>
          </Button>
        </div>

        {/* Ingest & Setup Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSetupOpen(true)}
            className="h-9 rounded-xl text-xs font-bold gap-1.5 border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Link2 className="h-3.5 w-3.5 text-blue-400" />
            <span>Form Sync Setup</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsIngestOpen(true)}
            className="h-9 rounded-xl text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Ingest Form Response</span>
          </Button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Client & Project</th>
                <th className="py-3.5 px-4">Rating Breakdown</th>
                <th className="py-3.5 px-4">Testimonial Content</th>
                <th className="py-3.5 px-4">Permissions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No reviews found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((rev) => (
                  <tr
                    key={rev.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReview(rev)}
                  >
                    {/* Client Information */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-850 border border-slate-700/80 shrink-0 mt-0.5 flex items-center justify-center">
                          {rev.image_url ? (
                            <img
                              src={rev.image_url}
                              alt={rev.client_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-400 font-bold text-xs font-mono">
                              {rev.client_name ? rev.client_name.substring(0, 2).toUpperCase() : '??'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{rev.client_name}</span>
                            {rev.featured && (
                              <span title="Featured Testimonial">
                                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-xs">
                            {rev.designation ? `${rev.designation}, ` : ''}
                            {rev.company_name || rev.company || 'Direct Client'}
                          </span>
                          {rev.project_name && (
                            <span className="text-[11px] text-blue-400 font-medium">
                              Project: {rev.project_name}
                            </span>
                          )}
                          {rev.email && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {rev.email}
                            </span>
                          )}
                          {rev.source_submission_id && (
                            <span className="text-[10px] text-slate-600 font-mono">
                              ID: {rev.source_submission_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Rating Breakdown */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                          <span>{'★'.repeat(rev.display_rating)}</span>
                          <span className="text-slate-400 text-xs font-semibold">
                            ({rev.average_rating.toFixed(2)}/5)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 space-y-0.5 mt-0.5">
                          {rev.overall_service_rating && (
                            <div>Service: <strong className="text-slate-200">{rev.overall_service_rating}/5</strong></div>
                          )}
                          {rev.software_quality_rating && (
                            <div>Quality: <strong className="text-slate-200">{rev.software_quality_rating}/5</strong></div>
                          )}
                          {rev.communication_support_rating && (
                            <div>Support: <strong className="text-slate-200">{rev.communication_support_rating}/5</strong></div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Testimonial / Public Review */}
                    <td className="py-4 px-4 align-top max-w-xs sm:max-w-sm">
                      <div className="space-y-1">
                        <p className="line-clamp-2 text-slate-300 italic text-xs leading-relaxed">
                          &ldquo;{rev.review_text || rev.review}&rdquo;
                        </p>
                        {rev.review_text && rev.original_review && rev.review_text !== rev.original_review && (
                          <span className="inline-block text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                            Admin Edited
                          </span>
                        )}
                        {rev.admin_note && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded w-fit">
                            <span>Note: {rev.admin_note}</span>
                          </div>
                        )}
                        {rev.improvement_feedback && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5 text-slate-500" />
                            <span className="truncate">Internal feedback attached</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Permissions */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-1">
                        {rev.can_publish_review ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold w-fit flex items-center gap-1">
                            <Globe className="h-2.5 w-2.5" />
                            <span>Web Allowed</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] font-bold w-fit flex items-center gap-1" title="Customer requested private feedback">
                            <Lock className="h-2.5 w-2.5" />
                            <span>Private Only</span>
                          </Badge>
                        )}

                        <span className="text-[10px] text-slate-400">
                          Identity: <strong className="text-slate-300">
                            {rev.identity_display_permission?.includes('first')
                              ? 'First Name'
                              : rev.identity_display_permission === 'No'
                              ? 'Anonymous'
                              : 'Full'}
                          </strong>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-1">
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
                        {rev.status === 'approved' && !rev.can_publish_review && (
                          <span className="text-[9px] text-amber-400/90 font-medium leading-tight">
                            Internal approval only (private)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Approval Actions */}
                    <td className="py-4 px-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status !== 'approved' && (
                          <Button
                            size="xs"
                            onClick={() => handleApprove(rev.id)}
                            disabled={isUpdating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2.5 rounded-lg"
                            title="Approve review"
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
                            title="Reject review (keeps record as internal history)"
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-md border border-yellow-400/20">
                    {isEditing ? 'Edit Client Review' : 'Review Moderation & Feedback Details'}
                  </span>
                  {selectedReview?.can_publish_review ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Web Permission Granted
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Private Feedback (No Web Display)
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mt-2">
                  {selectedReview?.client_name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedReview?.designation ? `${selectedReview.designation} · ` : ''}
                  {selectedReview?.company_name || selectedReview?.company || 'Direct Client'}
                  {selectedReview?.project_name ? ` · Project: ${selectedReview.project_name}` : ''}
                </p>
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

            {/* Editing Mode */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Immutable Original Review Notice */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                    <span>Original Testimonial (Immutable — Customer Submission)</span>
                    <Lock className="h-3 w-3 text-slate-500" />
                  </label>
                  <p className="text-xs text-slate-300 italic leading-relaxed select-text">
                    &ldquo;{selectedReview?.original_review || selectedReview?.review}&rdquo;
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-blue-400">
                    Public Review Text (Editable for grammar/presentation)
                  </label>
                  <textarea
                    rows={4}
                    value={editReviewText}
                    onChange={(e) => setEditReviewText(e.target.value)}
                    required
                    className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-blue-500/30 text-slate-200 text-xs focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Editing this will update what appears on the website (if approved & permitted). The original customer submission is always preserved.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Client Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="mt-1 bg-slate-950 border-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Company</label>
                    <Input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Designation</label>
                    <Input
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Project Name</label>
                    <Input
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                    <span>Client Avatar / Photo URL</span>
                    {editImageUrl && <span className="text-[10px] text-emerald-400 font-semibold">Photo Active</span>}
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center">
                      {editImageUrl ? (
                        <img
                          src={editImageUrl}
                          alt="Avatar Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0.3';
                          }}
                        />
                      ) : (
                        <span className="text-slate-500 text-xs font-bold font-mono">
                          {editName ? editName.substring(0, 2).toUpperCase() : '??'}
                        </span>
                      )}
                    </div>
                    <Input
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="e.g. /images/testimonials/alex-avatar.png or https://..."
                      className="bg-slate-950 border-slate-800 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter local image path (e.g. <code>/images/testimonials/alex-avatar.png</code>) or public URL to display photo on client website.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-400">Internal Admin Note (Private)</label>
                  <Input
                    value={editAdminNote}
                    onChange={(e) => setEditAdminNote(e.target.value)}
                    placeholder="Internal moderation or verification notes (never displayed publicly)"
                    className="mt-1 bg-slate-950 border-slate-800 text-amber-300 text-xs"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-slate-800 text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              selectedReview && (
                <div className="space-y-5">
                  {/* Rating Breakdown Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Overall Service</span>
                      <p className="text-sm font-bold text-yellow-400 mt-1">
                        ★ {selectedReview.overall_service_rating ? `${selectedReview.overall_service_rating}/5` : 'N/A'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Software Quality</span>
                      <p className="text-sm font-bold text-yellow-400 mt-1">
                        ★ {selectedReview.software_quality_rating ? `${selectedReview.software_quality_rating}/5` : 'N/A'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Communication</span>
                      <p className="text-sm font-bold text-yellow-400 mt-1">
                        ★ {selectedReview.communication_support_rating ? `${selectedReview.communication_support_rating}/5` : 'N/A'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-400">Calculated Average</span>
                      <p className="text-sm font-bold text-white mt-1">
                        {selectedReview.average_rating.toFixed(2)} / 5
                      </p>
                      <span className="text-[9px] text-yellow-400 font-semibold block mt-0.5">
                        {'★'.repeat(selectedReview.display_rating)} ({selectedReview.display_rating} Stars)
                      </span>
                    </div>
                  </div>

                  {/* Public Testimonial View */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                      <span>Public / Moderated Testimonial</span>
                      {selectedReview.review_text !== selectedReview.original_review && (
                        <span className="text-blue-400">Modified from original</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      &ldquo;{selectedReview.review_text || selectedReview.review}&rdquo;
                    </p>
                  </div>

                  {/* Original Customer Testimonial (if edited) */}
                  {selectedReview.review_text !== selectedReview.original_review && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Original Customer Submission (Permanent Record)
                      </span>
                      <p className="text-slate-400 italic">
                        &ldquo;{selectedReview.original_review}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Internal Feedback Section */}
                  {(selectedReview.liked_most || selectedReview.would_recommend || selectedReview.improvement_feedback) && (
                    <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-400">
                        <Lock className="h-3 w-3" />
                        <span>Internal Feedback (Confidential - Visible Only to Admins)</span>
                      </div>

                      {selectedReview.liked_most && (
                        <div className="text-xs">
                          <span className="text-slate-400 font-medium">What they liked most:</span>
                          <p className="text-slate-200 mt-0.5">{selectedReview.liked_most}</p>
                        </div>
                      )}

                      {selectedReview.would_recommend && (
                        <div className="text-xs">
                          <span className="text-slate-400 font-medium">Would recommend to others:</span>
                          <span className="ml-2 font-bold text-emerald-400">{selectedReview.would_recommend}</span>
                        </div>
                      )}

                      {selectedReview.improvement_feedback && (
                        <div className="text-xs p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <span className="text-amber-400 font-bold block mb-1">Improvement Suggestions:</span>
                          <p className="text-amber-200 leading-relaxed">{selectedReview.improvement_feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Permissions & Metadata Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Website Publish Permission</span>
                      <p className={selectedReview.can_publish_review ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {selectedReview.website_publish_permission || (selectedReview.can_publish_review ? 'Granted' : 'Private')}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Identity Display Permission</span>
                      <p className="text-slate-200 font-semibold">
                        {selectedReview.identity_display_permission || 'Yes'}
                      </p>
                    </div>

                    {selectedReview.submitted_at && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Submitted Date</span>
                        <p className="text-slate-300 font-mono text-[11px]">
                          {new Date(selectedReview.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {selectedReview.source_submission_id && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Source ID</span>
                        <p className="text-slate-400 font-mono text-[11px] truncate">
                          {selectedReview.source_submission_id}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedReview.admin_note && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      <strong>Admin Note:</strong> {selectedReview.admin_note}
                    </div>
                  )}

                  {/* Modal Action Footer */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(selectedReview)}
                      className="border-slate-800 text-slate-300 hover:text-white"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Testimonial
                    </Button>

                    <div className="flex items-center gap-2">
                      {selectedReview.status !== 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(selectedReview.id)}
                          disabled={isUpdating}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" /> Approve Review
                        </Button>
                      )}
                      {selectedReview.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(selectedReview.id)}
                          disabled={isUpdating}
                          className="font-bold"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" /> Reject
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

      {/* Ingest Form Response Modal */}
      {isIngestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                  Customer Feedback Ingestion
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  Ingest Google Form Submission
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add a client response directly into the pending queue with duplicate protection and rating calculations.
                </p>
              </div>
              <button
                onClick={() => setIsIngestOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick prefill helper */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs text-blue-300 font-medium">
                Want to test the moderation & client display flow right now?
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePrefillSample}
                className="h-7 text-[11px] font-bold border-blue-500/40 text-blue-300 hover:text-white hover:bg-blue-600 gap-1 rounded-lg"
              >
                <Sparkles className="h-3 w-3" />
                <span>Prefill Sample Data</span>
              </Button>
            </div>

            <form onSubmit={handleIngestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                    Client Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    required
                    value={ingestName}
                    onChange={(e) => setIngestName(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="h-10 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                    Company / Organization
                  </label>
                  <Input
                    value={ingestCompany}
                    onChange={(e) => setIngestCompany(e.target.value)}
                    placeholder="e.g. Apex Capital Partners"
                    className="h-10 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                    Designation / Title
                  </label>
                  <Input
                    value={ingestDesignation}
                    onChange={(e) => setIngestDesignation(e.target.value)}
                    placeholder="e.g. Chief Technology Officer"
                    className="h-10 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                    Project Name
                  </label>
                  <Input
                    value={ingestProject}
                    onChange={(e) => setIngestProject(e.target.value)}
                    placeholder="e.g. Institutional Trading Portal"
                    className="h-10 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                    Client Email (Optional)
                  </label>
                  <Input
                    type="email"
                    value={ingestEmail}
                    onChange={(e) => setIngestEmail(e.target.value)}
                    placeholder="e.g. client@company.com"
                    className="h-10 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* 3 Numerical Ratings */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold uppercase text-slate-400 block">
                  Service & Quality Ratings (1 to 5 Stars)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Overall Service</span>
                    <select
                      value={ingestOverallRating}
                      onChange={(e) => setIngestOverallRating(e.target.value)}
                      className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-2.5 font-bold"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} Stars {n === 5 ? '★ (Excellent)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Software Quality</span>
                    <select
                      value={ingestSoftwareRating}
                      onChange={(e) => setIngestSoftwareRating(e.target.value)}
                      className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-2.5 font-bold"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} Stars {n === 5 ? '★ (Flawless)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Communication</span>
                    <select
                      value={ingestSupportRating}
                      onChange={(e) => setIngestSupportRating(e.target.value)}
                      className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-2.5 font-bold"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} Stars {n === 5 ? '★ (Responsive)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Testimonial Quote */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                  Client Testimonial Review <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={ingestTestimonial}
                  onChange={(e) => setIngestTestimonial(e.target.value)}
                  placeholder="Paste what the customer wrote about Astraiv Technologies..."
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Qualitative feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    What Did You Like Most?
                  </label>
                  <textarea
                    rows={2}
                    value={ingestLikedMost}
                    onChange={(e) => setIngestLikedMost(e.target.value)}
                    placeholder="e.g. Code quality, high velocity..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Suggestions / Improvements
                  </label>
                  <textarea
                    rows={2}
                    value={ingestImprovement}
                    onChange={(e) => setIngestImprovement(e.target.value)}
                    placeholder="e.g. None, smooth delivery..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Website Publish Permission
                  </label>
                  <select
                    value={ingestWebPerm}
                    onChange={(e) => setIngestWebPerm(e.target.value)}
                    className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-2.5 font-bold"
                  >
                    <option value="Yes">Yes — Permission granted to publish</option>
                    <option value="No">No — Private internal feedback only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Identity Display Permission
                  </label>
                  <select
                    value={ingestIdentityPerm}
                    onChange={(e) => setIngestIdentityPerm(e.target.value)}
                    className="w-full h-9 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 px-2.5 font-bold"
                  >
                    <option value="Yes">Yes — Full Name & Company</option>
                    <option value="Display only my first name with review.">Display First Name Only</option>
                    <option value="No">No — Anonymous (Astraiv Client)</option>
                  </select>
                </div>
              </div>

              {/* Form submit footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsIngestOpen(false)}
                  className="border-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isIngesting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5"
                >
                  {isIngesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Ingesting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Ingest to Moderation Queue</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Form & Apps Script Setup Guide Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  Integration Guide
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  Google Form & Google Sheet Real-time Sync
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  How Google Form responses are automatically forwarded to Astraiv Technologies database.
                </p>
              </div>
              <button
                onClick={() => setIsSetupOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Why it doesn't push to localhost note */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <Info className="h-4 w-4 shrink-0" />
                <span>Why doesn&apos;t a Google Form push directly to a local development machine?</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Google Forms runs on Google Cloud servers. Google Forms has no built-in HTTP webhook feature. Responses are stored in Google Sheets, where a Google Apps Script trigger pushes them to our webhook endpoint.
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Because Google Cloud servers cannot reach your private <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">http://localhost:3001</code>, testing from Google Cloud requires a public tunnel or deploying to production. Alternatively, use the <strong>Ingest Form Response</strong> button above to test instantly!
              </p>
            </div>

            {/* Webhook Configuration Box */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Webhook Configuration Credentials
              </h4>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Production Webhook URL</span>
                <code className="text-xs font-mono text-emerald-400 block bg-slate-900 p-2 rounded-xl border border-slate-800 mt-1 select-all">
                  https://superuser.admin.astraivtechnologies.com/api/reviews/google-form
                </code>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Local Webhook URL (Active Tunnel)</span>
                <code className="text-xs font-mono text-blue-400 block bg-slate-900 p-2 rounded-xl border border-slate-800 mt-1 select-all">
                  https://vuehb-103-130-105-178.free.pinggy.net/api/reviews/google-form
                </code>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Webhook Secret Token</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-yellow-300 bg-slate-900 p-2 rounded-xl border border-slate-800 flex-1 select-all">
                    astraiv_gsheet_webhook_secret_2026
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyWebhookSecret}
                    className="h-8 border-slate-800 text-xs font-bold gap-1"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 4 Step Setup Guide */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Setup Steps in Google Sheets
              </h4>
              <div className="space-y-2 text-[11px] leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-white block mb-0.5">Step 1: Link Form to Spreadsheet</strong>
                  Open your Google Form &gt; <strong>Responses</strong> tab &gt; Click <strong>Link to Sheets</strong> to create or open the connected spreadsheet.
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-white block mb-0.5">Step 2: Open Apps Script</strong>
                  In the Google Sheet menu, click <strong>Extensions &gt; Apps Script</strong>. Delete default code and paste the code from <code className="text-blue-400 font-mono">scripts/google-sheets-sync.gs</code>.
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-white block mb-0.5">Step 3: Set Script Properties</strong>
                  In Apps Script, click <strong>Project Settings (gear icon) &gt; Script Properties</strong>, add:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-400">
                    <li><code className="text-slate-300">WEBHOOK_URL</code>: your production or tunnel URL</li>
                    <li><code className="text-slate-300">WEBHOOK_SECRET</code>: <code className="text-yellow-300">astraiv_gsheet_webhook_secret_2026</code></li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <strong className="text-white block mb-0.5">Step 4: Add Installable Trigger</strong>
                  Click the <strong>Triggers</strong> icon (alarm clock) &gt; <strong>+ Add Trigger</strong>:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-400">
                    <li>Function: <code className="text-emerald-400">onFormSubmit</code></li>
                    <li>Event source: <code className="text-emerald-400">From spreadsheet</code></li>
                    <li>Event type: <code className="text-emerald-400">On form submit</code></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <Button
                size="sm"
                onClick={() => setIsSetupOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

