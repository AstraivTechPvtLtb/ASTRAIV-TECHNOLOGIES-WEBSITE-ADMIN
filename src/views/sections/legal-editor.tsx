'use client';

/**
 * @file admin/src/views/sections/legal-editor.tsx
 * @description [VIEW] Versioned Legal Governance Editor for Privacy Policy and Terms of Service.
 * Supports: Immutable published revisions, Draft editing, Live preview, Revisions history, and Restorations.
 */

import { useState } from 'react';
import {
  saveLegalDraft,
  publishLegalRevision,
  restoreLegalRevision,
} from '@/controllers/legal.controller';
import type {
  LegalDocumentData,
  LegalSection,
} from '@/controllers/legal.controller';
import {
  ShieldCheck,
  Scale,
  Save,
  Send,
  RotateCcw,
  Clock,
  History,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  Lock,
  Database,
  Globe,
  Mail,
  Award,
  RefreshCw,
  Loader2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

const AVAILABLE_ICONS = [
  { label: 'ShieldCheck (Governance)', value: 'ShieldCheck', icon: ShieldCheck },
  { label: 'Eye (Privacy / Telemetry)', value: 'Eye', icon: Eye },
  { label: 'Database (Persistence & Storage)', value: 'Database', icon: Database },
  { label: 'Lock (Security & Encryption)', value: 'Lock', icon: Lock },
  { label: 'Globe (Third-Party Subprocessors)', value: 'Globe', icon: Globe },
  { label: 'Mail (Contact / Legal Notice)', value: 'Mail', icon: Mail },
  { label: 'FileText (Agreement & Scope)', value: 'FileText', icon: FileText },
  { label: 'Award (Intellectual Property)', value: 'Award', icon: Award },
  { label: 'RefreshCw (SLAs & Hypercare)', value: 'RefreshCw', icon: RefreshCw },
  { label: 'Scale (Governing Law & Liability)', value: 'Scale', icon: Scale },
];

function getLegalIconComponent(iconName?: string) {
  const norm = (iconName || '').toLowerCase().trim();
  switch (norm) {
    case 'eye': return Eye;
    case 'database': return Database;
    case 'lock': return Lock;
    case 'globe': return Globe;
    case 'mail': return Mail;
    case 'filetext':
    case 'file-text': return FileText;
    case 'award': return Award;
    case 'refreshcw':
    case 'refresh': return RefreshCw;
    case 'scale': return Scale;
    case 'shieldcheck':
    default: return ShieldCheck;
  }
}

interface LegalEditorProps {
  initialDocument: LegalDocumentData;
}

export function LegalEditor({ initialDocument }: LegalEditorProps) {
  const [doc, setDoc] = useState<LegalDocumentData>(initialDocument);
  const [activeTab, setActiveTab] = useState<'editor' | 'live' | 'history'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Draft form state initialized from draft or current revision
  const sourceRevision = doc.draftRevision || doc.currentRevision;
  const [title, setTitle] = useState(sourceRevision?.title || doc.title);
  const [effectiveDate, setEffectiveDate] = useState(sourceRevision?.effectiveDate || 'September 2026');
  const [summary, setSummary] = useState(sourceRevision?.summary || '');
  const [changelog, setChangelog] = useState(sourceRevision?.changelog || '');
  const [sections, setSections] = useState<LegalSection[]>(sourceRevision?.sections || []);

  const handleAddSection = () => {
    setSections(prev => [
      ...prev,
      {
        icon: 'ShieldCheck',
        title: `${prev.length + 1}. New Policy Section`,
        content: 'Enter section content and clauses here...'
      }
    ]);
  };

  const handleUpdateSection = (index: number, field: keyof LegalSection, val: string) => {
    setSections(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await saveLegalDraft({
        documentSlug: doc.slug,
        title,
        effectiveDate,
        summary,
        changelog,
        sections
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Draft saved successfully. Ready for preview or publishing.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to save draft.' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error)?.message || 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (revisionId?: string) => {
    const targetRevId = revisionId || doc.draftRevision?.id;
    if (!targetRevId) {
      // If no draft ID yet, save first then publish
      setIsPublishing(true);
      setFeedback(null);
      try {
        const saveRes = await saveLegalDraft({
          documentSlug: doc.slug,
          title,
          effectiveDate,
          summary,
          changelog,
          sections
        });

        if (!saveRes.success || !saveRes.revisionId) {
          setFeedback({ type: 'error', message: saveRes.error || 'Could not create draft to publish.' });
          setIsPublishing(false);
          return;
        }

        const pubRes = await publishLegalRevision(saveRes.revisionId);
        if (pubRes.success) {
          setFeedback({ type: 'success', message: `Version published successfully and is now active on https://www.astraivtechnologies.com/en/${doc.slug}!` });
        } else {
          setFeedback({ type: 'error', message: pubRes.error || 'Failed to publish revision.' });
        }
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    setIsPublishing(true);
    setFeedback(null);
    try {
      const res = await publishLegalRevision(targetRevId);
      if (res.success) {
        setFeedback({ type: 'success', message: `Version published successfully and is now active on public site!` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to publish revision.' });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRestore = async (historicalRevId: string) => {
    setRestoringId(historicalRevId);
    setFeedback(null);
    try {
      const res = await restoreLegalRevision(historicalRevId);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Historical revision restored as new working draft!' });
        setActiveTab('editor');
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to restore revision.' });
      }
    } finally {
      setRestoringId(null);
    }
  };

  const currentRev = doc.currentRevision;

  return (
    <div className="space-y-6">
      {/* Top Banner with Document Identity and Live Status */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">{doc.title}</span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
              Live Version {currentRev?.versionNumber || 1}
            </Badge>
            {doc.draftRevision && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                Draft V{doc.draftRevision.versionNumber} in Progress
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {doc.description || 'Mandatory compliance document with immutable publication records.'}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
            <span>Effective Date: <strong className="text-slate-300">{currentRev?.effectiveDate || 'September 2026'}</strong></span>
            <span>•</span>
            <span>Published: <strong className="text-slate-300">{currentRev?.publishedAt ? new Date(currentRev.publishedAt).toLocaleDateString() : 'Active'}</strong></span>
            <span>•</span>
            <span>Author: <strong className="text-slate-300">{currentRev?.authorName || 'Legal Governance'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`http://localhost:3000/en/${doc.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <span>View Live Page</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>

          <Button
            onClick={() => handlePublish()}
            disabled={isPublishing}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Publish Live</span>
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'editor' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Draft Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Current Live Version</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Revision History ({doc.revisions.length})</span>
        </button>
      </div>

      {/* TAB 1: DRAFT EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <span className="text-sm font-bold text-white">Document Metadata & Changelog</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  variant="outline"
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Working Draft</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Document Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Privacy Policy"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Effective Date</label>
                <Input
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  placeholder="e.g. October 2026"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Changelog Note (Reason for revision)</label>
                <Input
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="e.g. Updated third-party cloud subprocessors and clarified data retention SLA."
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Repeatable Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Document Sections & Clauses ({sections.length})</h3>
                <p className="text-xs text-slate-400">Structured sections formatted to render directly on the public client layout.</p>
              </div>

              <Button
                onClick={handleAddSection}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Section</span>
              </Button>
            </div>

            <div className="space-y-4">
              {sections.map((sec, idx) => {
                const IconComp = getLegalIconComponent(sec.icon);
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 relative group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <IconComp className="h-4 w-4" />
                        </div>
                        <Input
                          value={sec.title}
                          onChange={(e) => handleUpdateSection(idx, 'title', e.target.value)}
                          placeholder="Section Title (e.g. 1. Information We Collect)"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-semibold flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={sec.icon || 'ShieldCheck'}
                          onChange={(e) => handleUpdateSection(idx, 'icon', e.target.value)}
                          aria-label="Section Icon"
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                        >
                          {AVAILABLE_ICONS.map(ic => (
                            <option key={ic.value} value={ic.value}>{ic.label}</option>
                          ))}
                        </select>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveSection(idx)}
                          className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Content / Clauses (Supports Markdown formatting & bullet points)</label>
                      <textarea
                        rows={6}
                        value={sec.content}
                        onChange={(e) => handleUpdateSection(idx, 'content', e.target.value)}
                        placeholder="Enter terms, legal commitments, bulleted sub-clauses..."
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CURRENT LIVE VERSION */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Immutable Published Revision (V{currentRev?.versionNumber || 1})</h3>
                <p className="text-xs text-slate-400">This exact version is currently served to all public visitors.</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Live & Active
              </Badge>
            </div>

            <div className="space-y-4 pt-2">
              {currentRev?.sections.map((sec, idx) => {
                const IconComp = getLegalIconComponent(sec.icon);
                return (
                  <div key={idx} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
                    <div className="flex items-center gap-2.5 text-white text-xs font-bold">
                      <IconComp className="h-4 w-4 text-blue-400" />
                      <span>{sec.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans pl-6">
                      {sec.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVISION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Complete Legal Audit Trail</h3>
              <p className="text-xs text-slate-400">Historical legal revisions are preserved immutably for compliance auditability.</p>
            </div>

            <div className="divide-y divide-slate-800">
              {doc.revisions.map((rev) => {
                const isLive = rev.id === doc.currentRevisionId || rev.status === 'published';
                return (
                  <div key={rev.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Version {rev.versionNumber}</span>
                        <Badge
                          variant="outline"
                          className={isLive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : rev.status === 'draft' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}
                        >
                          {isLive ? 'LIVE' : rev.status.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {rev.effectiveDate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{rev.changelog || 'Standard revision update.'}</p>
                      <span className="text-[10px] text-slate-500 block">
                        Saved by {rev.authorName || 'Admin'} on {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isLive && (
                        <Button
                          onClick={() => handleRestore(rev.id)}
                          disabled={restoringId === rev.id}
                          variant="outline"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {restoringId === rev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          <span>Restore as New Draft</span>
                        </Button>
                      )}
                      {rev.status === 'draft' && (
                        <Button
                          onClick={() => handlePublish(rev.id)}
                          disabled={isPublishing}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Publish Now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
