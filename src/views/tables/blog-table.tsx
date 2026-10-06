'use client';

/**
 * @file admin/src/views/tables/blog-table.tsx
 * @description [VIEW] Admin Blog CMS Management mirroring the Client Website Insights layout:
 * - Place-based section switching ('Engineering Blog', 'AI Insight and Research', 'All Publications')
 * - Rich visual card interfaces (identical to client BlogCard and Spotlight card)
 * - In-place Admin Controls: Edit, Delete, Hide/Unhide (Live vs Draft), Add Picture (Upload/URL/Presets)
 * - Modal for creating and editing articles with complete metadata, markdown content, and picture management.
 */

import { useState, useMemo, useRef } from 'react';
import { AdminBlogPost, BlogSectionType } from '@/models/types';
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
  Bot,
  Code2,
  Upload,
  Link as LinkIcon,
  Clock,
  User,
  Layers,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  FileText,
  Camera,
  Cpu,
  BarChart3,
  HelpCircle,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';

interface BlogTableProps {
  initialData: AdminBlogPost[];
}

// Curated Category presets tailored for each section
const ENGINEERING_CATEGORIES = [
  'Software Engineering',
  'Cloud Infrastructure',
  'Systems & Architecture',
  'Web Development',
  'UI/UX & Branding',
  'DevOps & Reliability',
  'Backend & Go/Rust',
];

const AI_RESEARCH_CATEGORIES = [
  'Artificial Intelligence',
  'Autonomous Agents',
  'Vector Search & RAG',
  'Large Language Models',
  'Machine Learning',
  'Neural Architectures',
  'Technology & AI',
];

// Curated high-resolution photography presets for quick-attaching professional pictures
const IMAGE_PRESETS = {
  engineering: [
    {
      title: 'Cloud Datacenter',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Software Code & Terminal',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'UI/UX Blueprint',
      url: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Modern Architecture',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    },
  ],
  'ai-research': [
    {
      title: 'Neural Network Swarm',
      url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Autonomous AI Mind',
      url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Vector Embedding Space',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Quantum Cognitive Mesh',
      url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop',
    },
  ],
};

function formatDate(dateInput?: string | null): string {
  if (!dateInput) return 'Recently Published';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateInput;
  }
}

export function BlogTable({ initialData }: BlogTableProps) {
  const [data, setData] = useState<AdminBlogPost[]>(initialData);
  const [activeTab, setActiveTab] = useState<'engineering' | 'ai-research' | 'all'>('engineering');
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);

  // Form Fields
  const [formSection, setFormSection] = useState<BlogSectionType>('engineering');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('Astraiv Engineering Team');
  const [authorRole, setAuthorRole] = useState('Senior Systems Architect');
  const [readingTime, setReadingTime] = useState('5 min read');
  const [category, setCategory] = useState('Software Engineering');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');

  // Picture Upload Tab mode
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url' | 'presets'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to determine post section
  const getSection = (p: AdminBlogPost): BlogSectionType => {
    if (p.section) return p.section;
    if (p.tags?.some((t) => t.toLowerCase() === 'section:ai-research' || t.toLowerCase() === 'ai-research')) {
      return 'ai-research';
    }
    if (p.tags?.some((t) => t.toLowerCase() === 'section:engineering' || t.toLowerCase() === 'engineering')) {
      return 'engineering';
    }
    const cat = (p.category || '').toLowerCase();
    const isAi =
      cat.includes('ai') ||
      cat.includes('intelligence') ||
      cat.includes('autonomous') ||
      cat.includes('agent') ||
      cat.includes('vector') ||
      cat.includes('rag') ||
      cat.includes('machine learning') ||
      cat.includes('neural') ||
      cat.includes('llm');

    return isAi ? 'ai-research' : 'engineering';
  };

  // Section statistics
  const engineeringPosts = useMemo(
    () => data.filter((p) => getSection(p) === 'engineering'),
    [data]
  );
  const aiResearchPosts = useMemo(
    () => data.filter((p) => getSection(p) === 'ai-research'),
    [data]
  );

  const engineeringLive = engineeringPosts.filter((p) => p.status === 'published').length;
  const aiResearchLive = aiResearchPosts.filter((p) => p.status === 'published').length;

  // Active pool of posts based on current tab
  const currentSectionPosts = useMemo(() => {
    if (activeTab === 'engineering') return engineeringPosts;
    if (activeTab === 'ai-research') return aiResearchPosts;
    return data;
  }, [activeTab, engineeringPosts, aiResearchPosts, data]);

  // Filtered posts based on search and category filter
  const filteredData = useMemo(() => {
    return currentSectionPosts.filter((item) => {
      const matchesSearch =
        search === '' ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.slug.toLowerCase().includes(search.toLowerCase()) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(search.toLowerCase())) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.author.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        item.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [currentSectionPosts, search, selectedCategoryFilter]);

  // Spotlight / Featured article for the current section
  const spotlightPost = filteredData.length > 0 ? filteredData[0] : null;
  // Remaining articles for the grid
  const gridPosts = filteredData.length > 1 ? filteredData.slice(1) : [];

  // Open Create Modal
  const openCreateModal = (forcedSection?: BlogSectionType) => {
    const targetSection = forcedSection || (activeTab === 'all' ? 'engineering' : activeTab);

    setEditingPost(null);
    setFormSection(targetSection);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCoverImage(
      targetSection === 'ai-research'
        ? IMAGE_PRESETS['ai-research'][0].url
        : IMAGE_PRESETS.engineering[0].url
    );
    setAuthor('Astraiv Engineering Team');
    setAuthorRole(
      targetSection === 'ai-research' ? 'Principal AI Architect' : 'Senior Systems Architect'
    );
    setReadingTime('5 min read');
    setCategory(
      targetSection === 'ai-research' ? 'Artificial Intelligence' : 'Software Engineering'
    );
    setStatus('published');
    setImageUploadMode('url');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: AdminBlogPost) => {
    const postSection = getSection(p);
    setEditingPost(p);
    setFormSection(postSection);
    setTitle(p.title);
    setSlug(p.slug);
    setExcerpt(p.excerpt || '');
    setContent(p.content);
    setCoverImage(p.cover_image || '');
    setAuthor(p.author);
    setAuthorRole(
      p.author_role ||
        (postSection === 'ai-research' ? 'Principal AI Architect' : 'Senior Systems Architect')
    );
    setReadingTime(p.reading_time || '5 min read');
    setCategory(p.category);
    setStatus(p.status as 'draft' | 'published' | 'archived');
    setImageUploadMode('url');
    setIsModalOpen(true);
  };

  // Handle local file upload (converts directly to optimized data-URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose an image smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle visibility (Hide / Unhide)
  const handleToggleVisibility = async (post: AdminBlogPost) => {
    const nextStatus: 'published' | 'draft' = post.status === 'published' ? 'draft' : 'published';

    setData((prev) =>
      prev.map((item) => (item.id === post.id ? { ...item, status: nextStatus } : item))
    );

    try {
      const res = await toggleBlogVisibility(post.id, nextStatus);
      if (!res.success) {
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

  // Delete Article
  const handleDelete = async (id: string, postTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${postTitle}"?\n\nThis will remove the publication from both the Admin Portal and the Client Website.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await deleteBlogPost(id);
      if (res.success) {
        setData((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || 'Failed to delete article.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Submit
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
          author_role: authorRole,
          reading_time: readingTime,
          category,
          section: formSection,
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
                    author_role: authorRole,
                    reading_time: readingTime,
                    category,
                    section: formSection,
                    status,
                    cover_image: coverImage || null,
                  }
                : item
            )
          );
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to update article.');
        }
      } else {
        const generatedSlug =
          slug.trim() ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const res = await createBlogPost({
          title,
          slug: generatedSlug,
          excerpt,
          content,
          author,
          author_role: authorRole,
          reading_time: readingTime,
          category,
          section: formSection,
          status,
          cover_image: coverImage || null,
        });

        if (res.success && res.data) {
          setData((prev) => [res.data as AdminBlogPost, ...prev]);
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to create article.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Curated category suggestions for active section
  const currentCategorySuggestions =
    activeTab === 'ai-research' ? AI_RESEARCH_CATEGORIES : ENGINEERING_CATEGORIES;

  const modalCategorySuggestions =
    formSection === 'ai-research' ? AI_RESEARCH_CATEGORIES : ENGINEERING_CATEGORIES;

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* 1. EDITORIAL HEADER & ACTION BAR (MIRRORING CLIENT LAYOUT) */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Admin CMS & Publications</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Insights & Engineering Publications
          </h1>
          <p className="text-sm text-slate-400 font-normal mt-1 max-w-2xl leading-relaxed">
            Manage live publications, edit drafts, upload imagery, and categorize technical articles.
            Changes sync immediately with the public client website.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="pl-9 pr-8 h-10 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-xl text-xs focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Add New Blog Button */}
          <Button
            onClick={() => openCreateModal()}
            className="h-10 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-950/50 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>
              {activeTab === 'ai-research'
                ? '+ New AI Research Post'
                : activeTab === 'engineering'
                ? '+ New Engineering Blog'
                : '+ New Blog Article'}
            </span>
          </Button>

          {/* Direct link to public client */}
          <a
            href="http://localhost:3000/en/insights"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>Live Website</span>
            <ExternalLink className="h-3 w-3 text-slate-500 ml-0.5" />
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PLACE-BASED SECTION SWITCHER TABS (IDENTICAL TO CLIENT) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl w-fit">
        {/* Tab 1: Engineering Blog */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('engineering');
            setSelectedCategoryFilter('all');
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'engineering'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 scale-102'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Engineering Blog</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'engineering'
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {engineeringPosts.length}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">({engineeringLive} live)</span>
        </button>

        {/* Tab 2: AI Insight and Research */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('ai-research');
            setSelectedCategoryFilter('all');
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'ai-research'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 scale-102'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          <span>AI Insight & Research</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'ai-research'
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {aiResearchPosts.length}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">({aiResearchLive} live)</span>
        </button>

        {/* Tab 3: All Publications */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setSelectedCategoryFilter('all');
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 scale-102'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Publications</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {data.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. CATEGORY FILTER PILLS (MATCHING CLIENT TOPIC PILLS) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            selectedCategoryFilter === 'all'
              ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          All Topics
        </button>

        {currentCategorySuggestions.map((catName) => {
          const isSelected = selectedCategoryFilter.toLowerCase() === catName.toLowerCase();
          return (
            <button
              key={catName}
              type="button"
              onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : catName)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {catName}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. FEATURED SPOTLIGHT ARTICLE (MATCHING CLIENT 2-COLUMN SPOTLIGHT CARD) */}
      {/* ========================================================================= */}
      {spotlightPost && (
        <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/60 shadow-xl group hover:border-slate-700 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Image Side */}
            <div className="lg:col-span-7 relative min-h-75 sm:min-h-[360px] lg:min-h-105 overflow-hidden bg-slate-950">
              {spotlightPost.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spotlightPost.cover_image}
                  alt={spotlightPost.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103 opacity-90 group-hover:opacity-100"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-blue-900 via-indigo-950 to-slate-950 flex items-center justify-center text-slate-400 font-semibold text-sm">
                  Astraiv Featured Research
                </div>
              )}

              {/* Badges Over Image */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-full">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  <span>Featured Deep Dive</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md border ${
                    getSection(spotlightPost) === 'ai-research'
                      ? 'bg-blue-950/80 border-blue-500/40 text-blue-300'
                      : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
                  }`}
                >
                  {getSection(spotlightPost) === 'ai-research' ? (
                    <Bot className="h-3 w-3" />
                  ) : (
                    <Code2 className="h-3 w-3" />
                  )}
                  <span>
                    {getSection(spotlightPost) === 'ai-research'
                      ? 'AI Insight & Research'
                      : 'Engineering Blog'}
                  </span>
                </span>
              </div>

              {/* Quick Image Change Button Overlaid on Image */}
              <div className="absolute bottom-4 right-4 z-10">
                <Button
                  size="sm"
                  type="button"
                  onClick={() => openEditModal(spotlightPost)}
                  className="bg-black/80 hover:bg-black text-white border border-white/20 rounded-xl text-xs font-medium shadow-md backdrop-blur-md flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5 text-blue-400" />
                  <span>Change Picture</span>
                </Button>
              </div>
            </div>

            {/* Content Side with Dedicated Admin Controls Bar */}
            <div className="lg:col-span-5 p-7 sm:p-8 flex flex-col justify-between text-left bg-linear-to-b from-slate-900/90 to-slate-950/90">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase text-[10.5px]">
                    {spotlightPost.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{spotlightPost.reading_time || '5 min read'}</span>
                  </span>
                  <span>•</span>
                  <span>{formatDate(spotlightPost.created_at || spotlightPost.published_at)}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors mb-3 leading-snug">
                  {spotlightPost.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal mb-4 line-clamp-3">
                  {spotlightPost.excerpt ||
                    spotlightPost.content.substring(0, 160).replace(/[#*_`]/g, '') + '...'}
                </p>

                <div className="flex items-center gap-2.5 mb-6 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                    {spotlightPost.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{spotlightPost.author}</div>
                    <div className="text-[10.5px] text-slate-500">
                      {spotlightPost.author_role || 'Senior Systems Architect'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ADMIN CONTROLS BAR */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(spotlightPost)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    spotlightPost.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                  title="Click to toggle Hide / Unhide on client website"
                >
                  {spotlightPost.status === 'published' ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>Live on Client</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Hidden (Draft)</span>
                    </>
                  )}
                </button>

                {/* Edit, Delete, View Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(spotlightPost)}
                    className="h-8 px-2.5 rounded-xl bg-slate-800 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1 text-blue-400" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(spotlightPost.id, spotlightPost.title)}
                    className="h-8 px-2.5 rounded-xl bg-slate-800 border-slate-700 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span>Delete</span>
                  </Button>

                  <a
                    href={`http://localhost:3000/en/insights/${spotlightPost.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title="View live article on client website"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ARTICLE CARDS GRID (IDENTICAL TO CLIENT BLOGCARD WITH ADMIN BAR) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>
              {activeTab === 'ai-research'
                ? 'AI Research Publications'
                : activeTab === 'engineering'
                ? 'Engineering Articles'
                : 'All Publications'}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              ({filteredData.length} total)
            </span>
          </h3>
        </div>

        {filteredData.length === 0 ? (
          <div className="py-20 text-center rounded-[28px] border border-slate-800 bg-slate-900/40">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40 text-blue-400" />
            <h4 className="text-base font-semibold text-white">No publications found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || selectedCategoryFilter !== 'all'
                ? 'No articles match your current search query or category filter.'
                : `There are currently no articles in this section. Click below to write your first article.`}
            </p>
            <Button
              onClick={() => openCreateModal()}
              className="mt-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Create Article</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((post) => {
              const isLive = post.status === 'published';
              const postSection = getSection(post);

              return (
                <div
                  key={post.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-950/20"
                >
                  {/* Card Image Header */}
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    {post.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-slate-900 via-blue-950/40 to-slate-950 flex items-center justify-center text-slate-600">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}

                    {/* Top Category Badge */}
                    <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-blue-400 border border-slate-800">
                      {post.category}
                    </div>

                    {/* Top Section Badge */}
                    <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10.5px] font-medium text-slate-300 border border-slate-800 flex items-center gap-1">
                      {postSection === 'ai-research' ? (
                        <>
                          <Bot className="h-3 w-3 text-blue-400" />
                          <span>AI</span>
                        </>
                      ) : (
                        <>
                          <Code2 className="h-3 w-3 text-indigo-400" />
                          <span>Eng</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 flex flex-col p-5">
                    {/* Metadata line */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2 font-normal">
                      <span>{formatDate(post.created_at || post.published_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        {post.reading_time || '5 min read'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2">
                      {post.title}
                    </h4>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 flex-1 mb-4">
                      {post.excerpt ||
                        post.content.substring(0, 140).replace(/[#*_`]/g, '') + '...'}
                    </p>

                    {/* Author Line */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
                      <div className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px] text-blue-400 font-bold">
                        {post.author.charAt(0)}
                      </div>
                      <span className="truncate">{post.author}</span>
                    </div>

                    {/* IN-PLACE ADMIN CONTROLS BAR */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Hide / Unhide Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(post)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          isLive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                        title="Click to toggle Hide / Unhide"
                      >
                        {isLive ? (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>Live</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>

                      {/* Edit, Delete, View buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(post)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                          title="Edit article"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(post.id, post.title)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg"
                          title="Delete article"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <a
                          href={`http://localhost:3000/en/insights/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Preview on client website"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. CREATE / EDIT MODAL WITH PICTURE UPLOAD, CATEGORIES & METADATA */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {editingPost ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingPost ? 'Edit Technical Publication' : 'Create New Technical Publication'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Publish across Engineering Blog or AI Research with full markdown and image support.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* 1. Target Section Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Destination Section *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormSection('engineering');
                      setCategory('Software Engineering');
                      if (
                        !coverImage ||
                        IMAGE_PRESETS['ai-research'].some((p) => p.url === coverImage)
                      ) {
                        setCoverImage(IMAGE_PRESETS.engineering[0].url);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      formSection === 'engineering'
                        ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        formSection === 'engineering'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Code2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Engineering Blog</div>
                      <div className="text-[10.5px] text-slate-400">
                        Distributed Systems, Cloud & Dev
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormSection('ai-research');
                      setCategory('Artificial Intelligence');
                      if (
                        !coverImage ||
                        IMAGE_PRESETS.engineering.some((p) => p.url === coverImage)
                      ) {
                        setCoverImage(IMAGE_PRESETS['ai-research'][0].url);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      formSection === 'ai-research'
                        ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        formSection === 'ai-research'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">AI Insight & Research</div>
                      <div className="text-[10.5px] text-slate-400">
                        Agents, Vector RAG & LLMs
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Cover Picture Management */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                    <span>Article Cover Picture</span>
                  </label>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('url')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        imageUploadMode === 'url'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Web URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('upload')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        imageUploadMode === 'upload'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('presets')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        imageUploadMode === 'presets'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Preset Photos
                    </button>
                  </div>
                </div>

                {/* Mode 1: URL input */}
                {imageUploadMode === 'url' && (
                  <div className="space-y-2">
                    <Input
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-xl"
                    />
                    <p className="text-[10.5px] text-slate-500">
                      Paste any public image URL (Unsplash, Cloudflare, AWS S3).
                    </p>
                  </div>
                )}

                {/* Mode 2: Local File Upload */}
                {imageUploadMode === 'upload' && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-900/50 rounded-2xl p-6 text-center cursor-pointer transition-colors group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <p className="text-xs font-semibold text-slate-300">
                      Click to browse or drop an image from your computer
                    </p>
                    <p className="text-[10.5px] text-slate-500 mt-1">
                      Supports PNG, JPG, WebP, SVG up to 5MB. Converted to instant base64 storage.
                    </p>
                  </div>
                )}

                {/* Mode 3: Curated Presets */}
                {imageUploadMode === 'presets' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(IMAGE_PRESETS[formSection] || IMAGE_PRESETS.engineering).map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setCoverImage(preset.url)}
                        className={`relative rounded-xl overflow-hidden aspect-video border transition-all text-left group ${
                          coverImage === preset.url
                            ? 'border-blue-500 ring-2 ring-blue-500/50'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] font-semibold text-white truncate">
                            {preset.title}
                          </span>
                        </div>
                        {coverImage === preset.url && (
                          <div className="absolute top-1.5 right-1.5 bg-blue-600 rounded-full p-0.5 text-white">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Picture Preview */}
                {coverImage && (
                  <div className="relative rounded-2xl overflow-hidden aspect-video max-h-48 border border-slate-800 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="h-7 px-2 bg-black/80 hover:bg-black text-rose-400 rounded-lg text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Article Title *
                  </label>
                  <Input
                    required
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
                    placeholder="e.g. Why Cloudflare R2 is the Future of Asset Delivery"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL Slug *
                  </label>
                  <Input
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="cloudflare-r2-asset-delivery"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* 4. Category & Reading Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <Input
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category name"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl mb-2"
                  />
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {modalCategorySuggestions.map((catName) => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setCategory(catName)}
                        className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          category === catName
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Estimated Reading Time
                  </label>
                  <Input
                    value={readingTime}
                    onChange={(e) => setReadingTime(e.target.value)}
                    placeholder="e.g. 5 min read"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl mb-2"
                  />
                  <div className="flex gap-1.5">
                    {['3 min read', '5 min read', '7 min read', '10 min read'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setReadingTime(t)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 hover:text-white"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Author Name & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Author Name
                  </label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Astraiv Engineering Team"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Author Role / Title
                  </label>
                  <Input
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="Senior Systems Architect"
                    className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* 6. Visibility Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Client Visibility Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      status === 'published'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Eye className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Live on Client</div>
                      <div className="text-[10.5px] text-slate-500">
                        Visible to all public visitors
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      status === 'draft'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <EyeOff className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Hidden Draft</div>
                      <div className="text-[10.5px] text-slate-500">
                        Admin view only (unreleased)
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 7. Summary / Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Summary / Excerpt (Lead paragraph)
                </label>
                <textarea
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A concise summary of the article appearing on cards and search results..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-normal leading-relaxed"
                />
              </div>

              {/* 8. Full Markdown Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Article Content (Markdown) *
                </label>
                <textarea
                  required
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Article Headline&#10;&#10;Technical deep dive paragraphs...&#10;&#10;## Architecture Overview&#10;&#10;```typescript&#10;export const example = true;&#10;```"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold px-6 shadow-md shadow-blue-900/40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : editingPost ? (
                    'Update Publication'
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
