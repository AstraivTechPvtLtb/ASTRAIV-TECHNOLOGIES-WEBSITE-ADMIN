'use client';

/**
 * @file admin/src/views/tables/blog-table.tsx
 * @description [VIEW] Admin data table and modal dialog for creating, editing, and publishing blog articles.
 */

import { useState } from 'react';
import { AdminBlogPost } from '@/models/types';
import { createBlogPost, updateBlogPost, deleteBlogPost } from '@/controllers/blog.controller';
import { Plus, Edit, Trash2, X, Loader2, Search } from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface BlogTableProps {
  initialData: AdminBlogPost[];
}

export function BlogTable({ initialData }: BlogTableProps) {
  const [data, setData] = useState<AdminBlogPost[]>(initialData);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('AstraIV Engineering Team');
  const [category, setCategory] = useState('Engineering');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');

  const filteredData = data.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setAuthor('AstraIV Engineering Team');
    setCategory('Engineering');
    setStatus('draft');
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminBlogPost) => {
    setEditingPost(p);
    setTitle(p.title);
    setSlug(p.slug);
    setExcerpt(p.excerpt || '');
    setContent(p.content);
    setAuthor(p.author);
    setCategory(p.category);
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPost) {
        const res = await updateBlogPost(editingPost.id, {
          title,
          slug,
          excerpt,
          content,
          author,
          category,
          status,
        });
        if (res.success) {
          setData((prev) =>
            prev.map((item) =>
              item.id === editingPost.id
                ? { ...item, title, slug, excerpt, content, author, category, status }
                : item
            )
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await createBlogPost({
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt,
          content,
          author,
          category,
          status,
        });
        if (res.success && res.data) {
          setData((prev) => [res.data as AdminBlogPost, ...prev]);
          setIsModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    setIsSubmitting(true);
    try {
      const res = await deleteBlogPost(id);
      if (res.success) {
        setData((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="pl-10 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl"
          />
        </div>
        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Article</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Author</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  No articles found.
                </td>
              </tr>
            ) : (
              filteredData.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/40">
                  <td className="py-4 px-4 font-bold text-white text-sm">
                    {post.title}
                    <div className="text-[11px] text-slate-400 font-mono font-normal">/{post.slug}</div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-300">{post.category}</td>
                  <td className="py-4 px-4 text-slate-400">{post.author}</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant="outline"
                      className={
                        post.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }
                    >
                      {post.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditModal(post)}
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(post.id)}
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingPost ? 'Edit Blog Article' : 'New Blog Article'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated-if-blank"
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Category</label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Author</label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Excerpt</label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Content (Markdown / Text)</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full mt-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-bold">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Article'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
