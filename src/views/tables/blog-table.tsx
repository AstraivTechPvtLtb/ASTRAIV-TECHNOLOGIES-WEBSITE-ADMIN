'use client';

/**
 * @file admin/src/views/tables/blog-table.tsx
 * @description [VIEW] Admin data table and modal dialog for creating, editing, and publishing blog articles with interactive hide/unhide controls.
 */

import { useState } from 'react';
import { AdminBlogPost } from '@/models/types';
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  toggleBlogVisibility,
} from '@/controllers/blog.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Search,
  Eye,
  EyeOff,
  ExternalLink,
  ImageIcon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface BlogTableProps {
  initialData: AdminBlogPost[];
}

const COMMON_CATEGORIES = [
  'Technology & AI',
  'UI/UX & Branding',
  'Business Strategy',
  'Cloud Infrastructure',
  'Engineering',
];

export function BlogTable({ initialData }: BlogTableProps) {
  const [data, setData] = useState<AdminBlogPost[]>(initialData);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('Astraiv Engineering Team');
  const [category, setCategory] = useState('Technology & AI');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');

  const filteredData = data.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = data.filter((p) => p.status === 'published').length;
  const draftCount = data.filter((p) => p.status !== 'published').length;

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCoverImage('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop');
    setAuthor('Astraiv Engineering Team');
    setCategory('Technology & AI');
    setStatus('published');
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminBlogPost) => {
    setEditingPost(p);
    setTitle(p.title);
    setSlug(p.slug);
    setExcerpt(p.excerpt || '');
    setContent(p.content);
    setCoverImage(p.cover_image || '');
    setAuthor(p.author);
    setCategory(p.category);
    setStatus(p.status);
    setIsModalOpen(true);
  };

  // Toggle visibility (Hide / Unhide) with optimistic UI update
  const handleToggleVisibility = async (post: AdminBlogPost) => {
    const nextStatus: 'published' | 'draft' = post.status === 'published' ? 'draft' : 'published';

    // Optimistically update local state
    setData((prev) =>
      prev.map((item) => (item.id === post.id ? { ...item, status: nextStatus } : item))
    );

    try {
      const res = await toggleBlogVisibility(post.id, nextStatus);
      if (!res.success) {
        // Revert on failure
        setData((prev) =>
          prev.map((item) => (item.id === post.id ? { ...item, status: post.status } : item))
        );
        alert(res.error || 'Failed to toggle visibility status.');
      }
    } catch {
      setData((prev) =>
        prev.map((item) => (item.id === post.id ? { ...item, status: post.status } : item))
      );
      alert('Error updating article visibility.');
    }
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
          cover_image: coverImage || null,
        });
        if (res.success) {
          setData((prev) =>
            prev.map((item) =>
              item.id === editingPost.id
                ? {
                    ...item,
                    title,
                    slug,
                    excerpt,
                    content,
                    author,
                    category,
                    status,
                    cover_image: coverImage || null,
                  }
                : item
            )
          );
          setIsModalOpen(false);
        }
      } else {
        const generatedSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const res = await createBlogPost({
          title,
          slug: generatedSlug,
          excerpt,
          content,
          author,
          category,
          status,
          cover_image: coverImage || null,
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
    if (!confirm('Are you sure you want to delete this article? This will remove it from both client and admin.')) return;
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
      {/* Top action bar and quick statistics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="pl-10 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-1">
              ● {publishedCount} Live
            </Badge>
            {draftCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-2.5 py-1">
                ○ {draftCount} Hidden
              </Badge>
            )}
          </div>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {/* Main Blog Articles Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Article</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Author</th>
              <th className="py-3.5 px-4">Status & Visibility</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-sm">No articles found.</p>
                  <p className="text-xs text-slate-600 mt-0.5">Click &ldquo;New Article&rdquo; above to publish your first blog.</p>
                </td>
              </tr>
            ) : (
              filteredData.map((post) => {
                const isLive = post.status === 'published';
                return (
                  <tr key={post.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Article title, slug, and cover thumbnail */}
                    <td className="py-4 px-4 font-bold text-white text-sm">
                      <div className="flex items-center gap-3">
                        {post.cover_image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-12 h-10 rounded-lg object-cover border border-slate-800 shrink-0 bg-slate-950"
                          />
                        ) : (
                          <div className="w-12 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate max-w-xs md:max-w-md text-white font-semibold">
                            {post.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono font-normal truncate">
                            /{post.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 font-semibold text-slate-300 whitespace-nowrap">
                      {post.category}
                    </td>

                    {/* Author */}
                    <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                      {post.author}
                    </td>

                    {/* Interactive Visibility Toggle */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(post)}
                        title={isLive ? 'Click to HIDE this blog from client' : 'Click to UNHIDE and publish on client'}
                        className="group inline-flex items-center focus:outline-hidden cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className={
                            isLive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/20 transition-all font-bold text-xs py-1 px-2.5 flex items-center gap-1.5'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:bg-amber-500/20 transition-all font-bold text-xs py-1 px-2.5 flex items-center gap-1.5'
                          }
                        >
                          {isLive ? (
                            <>
                              <Eye className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Live on Client</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                              <span>Hidden (Draft)</span>
                            </>
                          )}
                        </Badge>
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Hide/Unhide Toggle Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleVisibility(post)}
                          title={isLive ? 'Hide Article from Client' : 'Unhide / Publish Article'}
                          className={
                            isLive
                              ? 'h-8 w-8 text-emerald-400 hover:text-white hover:bg-emerald-500/20'
                              : 'h-8 w-8 text-amber-400 hover:text-white hover:bg-amber-500/20'
                          }
                        >
                          {isLive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>

                        {/* View Live Article on Client */}
                        <a
                          href={`http://localhost:3000/en/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Live Article on Client Website"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        {/* Edit Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(post)}
                          title="Edit Article"
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(post.id)}
                          title="Delete Article"
                          className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog for Create & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingPost ? 'Edit Blog Article' : 'New Blog Article'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Changes will sync to the database and reflect on the client website.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingPost) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                    }}
                    required
                    placeholder="e.g. Building Scalable SaaS in 2026"
                    className="mt-1.5 bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    URL Slug *
                  </label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated-from-title"
                    required
                    className="mt-1.5 bg-slate-950 border-slate-800 text-slate-200 font-mono text-xs focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Category *
                  </label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    placeholder="e.g. Technology & AI"
                    className="mt-1.5 bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {COMMON_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`text-[9px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                          category === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Author Name
                  </label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Astraiv Engineering Team"
                    className="mt-1.5 bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Cover Image URL with Live Preview */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Featured / Cover Image URL
                </label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500 text-xs"
                  />
                  {coverImage && (
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="px-2.5 text-xs rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Image Preview Thumbnail */}
                {coverImage && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-20 h-14 rounded-lg object-cover border border-slate-700 bg-slate-900 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="text-[11px] text-slate-400 truncate">
                      <div className="font-semibold text-slate-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Image preview loaded
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 truncate block mt-0.5">
                        {coverImage}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Excerpt / Summary */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Excerpt / Summary (Card description on client)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief 1-2 sentence overview displayed on the blog card..."
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Content (Markdown / HTML) *
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder="Full article body content..."
                  className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs resize-none font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status / Visibility */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Publish Status (Client Visibility)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full mt-1.5 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="published">● Published (Live on Client Website)</option>
                  <option value="draft">○ Draft (Hidden from Client Website)</option>
                  <option value="archived">○ Archived (Hidden from Client Website)</option>
                </select>
              </div>

              {/* Footer action buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingPost ? (
                    'Update Article'
                  ) : (
                    'Publish Article'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
