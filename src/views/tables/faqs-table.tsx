'use client';

/**
 * @file admin/src/views/tables/faqs-table.tsx
 * @description [VIEW] Interactive management table for Frequently Asked Questions (FAQs).
 */

import { useState } from 'react';
import {
  createFaq,
  updateFaq,
  deleteFaq,
} from '@/controllers/faqs.controller';
import type { AdminFaq } from '@/controllers/faqs.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  HelpCircle,
  Star,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface FaqsTableProps {
  initialData: AdminFaq[];
}

export function FaqsTable({ initialData }: FaqsTableProps) {
  const [data, setData] = useState<AdminFaq[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<AdminFaq | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [category, setCategory] = useState('general');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [orderIndex, setOrderIndex] = useState(0);

  const openCreateModal = () => {
    setEditingFaq(null);
    setCategory('general');
    setQuestion('');
    setAnswer('');
    setIsFeatured(false);
    setStatus('published');
    setOrderIndex(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (faq: AdminFaq) => {
    setEditingFaq(faq);
    setCategory(faq.category);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsFeatured(faq.isFeatured);
    setStatus(faq.status);
    setOrderIndex(faq.orderIndex);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingFaq) {
        const res = await updateFaq(editingFaq.id, {
          category,
          question,
          answer,
          isFeatured,
          status,
          orderIndex
        });
        if (res.success) {
          setData(prev => prev.map(f => f.id === editingFaq.id ? {
            ...f,
            category,
            question,
            answer,
            isFeatured,
            status,
            orderIndex
          } : f));
          setIsModalOpen(false);
        }
      } else {
        const res = await createFaq({
          category,
          question,
          answer,
          isFeatured,
          status,
          orderIndex
        });
        if (res.success) {
          setData(prev => [...prev, {
            id: 'temp-' + Date.now(),
            category,
            question,
            answer,
            isFeatured,
            status,
            orderIndex,
            createdAt: new Date(),
            updatedAt: new Date()
          }]);
          setIsModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    setDeletingId(id);
    try {
      const res = await deleteFaq(id);
      if (res.success) {
        setData(prev => prev.filter(f => f.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredData = filterCategory === 'all'
    ? data
    : data.filter(f => f.category === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories ({data.length})</option>
            <option value="general">General & Company</option>
            <option value="services">Services & Architecture</option>
            <option value="pricing">Pricing & IP Ownership</option>
            <option value="engineering">Engineering & Stack</option>
            <option value="process">Process & Delivery</option>
          </select>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New FAQ</span>
        </Button>
      </div>

      <div className="space-y-3">
        {filteredData.map((faq) => (
          <div
            key={faq.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">{faq.question}</span>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] uppercase">
                  {faq.category}
                </Badge>
                {faq.isFeatured && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400" /> Featured
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditModal(faq)}
                className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(faq.id)}
                disabled={deletingId === faq.id}
                className="h-8 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {deletingId === faq.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="general">General & Company</option>
                  <option value="services">Services & Architecture</option>
                  <option value="pricing">Pricing & IP Ownership</option>
                  <option value="engineering">Engineering & Modernization</option>
                  <option value="process">Process & Delivery</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Question</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Can Astraiv build custom enterprise software from scratch?"
                  className="bg-slate-950 border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Answer</label>
                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Detailed, authoritative answer..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                  />
                  <span>Featured FAQ (Highlight on Homepage)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'published' | 'draft' | 'archived')}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Display Order</label>
                  <Input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-slate-800 border-slate-700 text-slate-300 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save FAQ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
