'use client';

/**
 * @file admin/src/views/tables/services-table.tsx
 * @description [VIEW] Admin data table and modal dialog for managing the services catalog and offerings.
 */

import { useState } from 'react';
import { AdminService } from '@/models/types';
import { createService, updateService, deleteService } from '@/controllers/services.controller';
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface ServicesTableProps {
  initialData: AdminService[];
}

export function ServicesTable({ initialData }: ServicesTableProps) {
  const [data, setData] = useState<AdminService[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Cpu');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [displayOrder, setDisplayOrder] = useState(0);

  const openCreateModal = () => {
    setEditingService(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setIcon('Cpu');
    setStatus('active');
    setDisplayOrder(data.length);
    setIsModalOpen(true);
  };

  const openEditModal = (srv: AdminService) => {
    setEditingService(srv);
    setTitle(srv.title);
    setSlug(srv.slug);
    setDescription(srv.description);
    setIcon(srv.icon);
    setStatus(srv.status);
    setDisplayOrder(srv.display_order);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingService) {
        const res = await updateService(editingService.id, {
          title,
          slug,
          description,
          icon,
          status,
          display_order: displayOrder,
        });
        if (res.success) {
          setData((prev) =>
            prev.map((s) =>
              s.id === editingService.id
                ? { ...s, title, slug, description, icon, status, display_order: displayOrder }
                : s
            )
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await createService({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description,
          icon,
          status,
          display_order: displayOrder,
        });
        if (res.success && res.data) {
          setData((prev) => [...prev, res.data as AdminService]);
          setIsModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    setIsSubmitting(true);
    try {
      const res = await deleteService(id);
      if (res.success) {
        setData((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-400">Total Services: {data.length}</h3>
        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Order</th>
              <th className="py-3.5 px-4">Service</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  No services configured yet.
                </td>
              </tr>
            ) : (
              data.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-800/40">
                  <td className="py-4 px-4 font-mono font-bold text-slate-500">#{srv.display_order}</td>
                  <td className="py-4 px-4 font-bold text-white text-sm">{srv.title}</td>
                  <td className="py-4 px-4 text-slate-400 max-w-md line-clamp-1">{srv.description}</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant="outline"
                      className={
                        srv.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }
                    >
                      {srv.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditModal(srv)}
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(srv.id)}
                        className="h-8 w-8 text-slate-400 hover:text-destructive"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Service Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 bg-slate-950 border-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'archived')}
                    className="w-full mt-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Display Order</label>
                  <Input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10))}
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-bold">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
