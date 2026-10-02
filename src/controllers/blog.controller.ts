'use server';

/**
 * @file admin/src/controllers/blog.controller.ts
 * @description [CONTROLLER] Business logic for managing blog articles, markdown content, and publishing states.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminBlogPost, AdminBlogInput, AdminActionResponse } from '@/models/types';
import { Prisma } from '@prisma/client';
import { requireAdminUser } from './auth.controller';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Intentionally ignored when invoked outside active Next.js request context (e.g. testing scripts)
  }
}

/**
 * Retrieves all blog articles for the admin panel.
 * Primary: Prisma (PostgreSQL direct connection shared with client)
 * Fallback: Supabase client
 */
export async function getBlogArticles(): Promise<{ data: AdminBlogPost[]; error?: string }> {
  // 1. Primary: PostgreSQL / Prisma DB
  try {
    const records = await db.blogPost.findMany({
      include: { author: true, category: true },
      orderBy: { createdAt: 'desc' },
    });

    if (records && records.length > 0) {
      const mapped: AdminBlogPost[] = records.map((p) => {
        const isAi =
          p.tags?.includes('section:ai-research') ||
          p.tags?.includes('ai-research') ||
          (!p.tags?.includes('section:engineering') &&
            (p.category?.name?.toLowerCase().includes('ai') ||
             p.category?.name?.toLowerCase().includes('research') ||
             p.category?.name?.toLowerCase().includes('neural') ||
             p.category?.name?.toLowerCase().includes('agent') ||
             p.category?.name?.toLowerCase().includes('machine learning') ||
             p.title.toLowerCase().includes('rag') ||
             p.title.toLowerCase().includes('vector')));

        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.summary,
          content: p.content,
          author: p.authorName || p.author?.name || 'Astraiv Engineering Team',
          author_role: p.authorRole || 'Senior Systems Architect',
          author_image: p.authorImage || p.author?.image || null,
          category: p.category?.name || 'Engineering',
          section: isAi ? 'ai-research' : 'engineering',
          tags: p.tags || [],
          reading_time: p.readingTime || '5 min read',
          status: p.published ? 'published' : 'draft',
          cover_image: p.featuredImage,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        };
      });

      return { data: mapped };
    }
  } catch (prismaErr) {
    console.warn('[Admin Prisma Blog Query Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
  }

  // 2. Secondary: Supabase client fallback
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseClient();
      const { data, error } = await supabase
        .from('blog_post')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return {
          data: data.map((p) => {
            const isAi =
              p.tags?.includes('section:ai-research') ||
              p.tags?.includes('ai-research') ||
              (!p.tags?.includes('section:engineering') &&
                (p.category?.toLowerCase().includes('ai') ||
                 p.category?.toLowerCase().includes('research') ||
                 p.title?.toLowerCase().includes('ai')));

            return {
              ...p,
              section: isAi ? 'ai-research' : 'engineering',
            } as AdminBlogPost;
          }),
        };
      }
    } catch (supaErr) {
      console.warn('[Admin Supabase Blog Query Notice]:', (supaErr as Error)?.message || supaErr);
    }
  }

  return { data: [] };
}

/**
 * Creates a new blog article.
 * Saves to Prisma (PostgreSQL) and syncs to Supabase if configured.
 */
export async function createBlogPost(data: AdminBlogInput): Promise<AdminActionResponse<AdminBlogPost>> {
  try {
    await requireAdminUser();
    let createdPost: AdminBlogPost | null = null;
    const isPublished = data.status === 'published';

    // 1. Primary: Prisma DB
    try {
      let author = await db.user.findFirst({ where: { role: 'ADMIN' } });
      if (!author) {
        author = await db.user.create({
          data: {
            name: data.author || 'Astraiv Admin',
            email: 'astraivtechnologies@gmail.com',
            emailVerified: true,
            role: 'ADMIN',
          },
        });
      }

      let category = await db.blogCategory.findFirst({ where: { name: data.category } });
      if (!category) {
        category = await db.blogCategory.create({
          data: {
            name: data.category || (data.section === 'ai-research' ? 'Artificial Intelligence' : 'Software Engineering'),
            slug: (data.category || (data.section === 'ai-research' ? 'ai' : 'engineering')).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
        });
      }

      const sectionTag = data.section === 'ai-research' ? 'section:ai-research' : 'section:engineering';
      const existingTags = data.tags || [];
      const tags = Array.from(new Set([...existingTags.filter(t => !t.startsWith('section:')), sectionTag]));

      const created = await db.blogPost.create({
        data: {
          title: data.title,
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          summary: data.excerpt || data.title,
          content: data.content,
          published: isPublished,
          featuredImage: data.cover_image || null,
          readingTime: data.reading_time || '5 min read',
          authorName: data.author || 'Astraiv Engineering Team',
          authorRole: data.author_role || (data.section === 'ai-research' ? 'Principal AI Architect' : 'Senior Systems Engineer'),
          authorImage: data.author_image || null,
          tags,
          status: data.status,
          authorId: author.id,
          categoryId: category.id,
        },
        include: { author: true, category: true },
      });

      createdPost = {
        id: created.id,
        title: created.title,
        slug: created.slug,
        excerpt: created.summary,
        content: created.content,
        author: created.authorName || created.author?.name || data.author,
        author_role: created.authorRole || data.author_role || null,
        author_image: created.authorImage || null,
        reading_time: created.readingTime || '5 min read',
        category: created.category?.name || data.category,
        section: data.section || (data.category.toLowerCase().includes('ai') ? 'ai-research' : 'engineering'),
        tags: created.tags,
        status: created.published ? 'published' : 'draft',
        cover_image: created.featuredImage,
        created_at: created.createdAt.toISOString(),
        updated_at: created.updatedAt.toISOString(),
      };
    } catch (prismaErr) {
      console.warn('[Admin Create Blog Post Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Secondary: Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        const payload: Record<string, unknown> = {
          title: data.title,
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt: data.excerpt,
          content: data.content,
          author: data.author,
          category: data.category,
          status: data.status,
          cover_image: data.cover_image,
        };
        if (createdPost?.id) {
          payload.id = createdPost.id;
        }

        const { data: supaCreated, error } = await supabase
          .from('blog_post')
          .upsert(payload)
          .select()
          .single();

        if (!error && supaCreated && !createdPost) {
          createdPost = supaCreated as AdminBlogPost;
        }
      } catch (supaErr) {
        console.warn('[Admin Create Blog Post Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/blog');
    safeRevalidate('/dashboard');

    if (createdPost) {
      return { success: true, data: createdPost };
    }

    return { success: false, error: 'Failed to persist blog post' };
  } catch (error) {
    console.error('[Create Blog Post Error]:', error);
    return { success: false, error: 'Failed to create blog post' };
  }
}

/**
 * Updates an existing blog article.
 */
export async function updateBlogPost(
  id: string,
  data: Partial<AdminBlogInput>
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    // 1. Primary: Prisma DB
    try {
      const updateData: Prisma.BlogPostUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.excerpt !== undefined) updateData.summary = data.excerpt;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.status !== undefined) {
        updateData.status = data.status;
        updateData.published = data.status === 'published';
      }
      if (data.cover_image !== undefined) updateData.featuredImage = data.cover_image;
      if (data.reading_time !== undefined) updateData.readingTime = data.reading_time;
      if (data.author !== undefined) updateData.authorName = data.author;
      if (data.author_role !== undefined) updateData.authorRole = data.author_role;
      if (data.author_image !== undefined) updateData.authorImage = data.author_image;

      if (data.section !== undefined || data.tags !== undefined) {
        const existing = await db.blogPost.findUnique({ where: { id }, select: { tags: true } });
        let currentTags = (existing?.tags || []).filter(t => !t.startsWith('section:'));
        if (data.tags) {
          currentTags = data.tags.filter(t => !t.startsWith('section:'));
        }
        if (data.section) {
          const sectionTag = data.section === 'ai-research' ? 'section:ai-research' : 'section:engineering';
          currentTags.push(sectionTag);
        }
        updateData.tags = Array.from(new Set(currentTags));
      }

      if (data.category) {
        let category = await db.blogCategory.findFirst({ where: { name: data.category } });
        if (!category) {
          category = await db.blogCategory.create({
            data: {
              name: data.category,
              slug: data.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            },
          });
        }
        updateData.category = { connect: { id: category.id } };
      }

      await db.blogPost.update({
        where: { id },
        data: updateData,
      });
    } catch (prismaErr) {
      console.warn('[Admin Update Blog Post Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Secondary: Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        await supabase
          .from('blog_post')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (supaErr) {
        console.warn('[Admin Update Blog Post Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/blog');
    safeRevalidate('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Update Blog Post Error]:', error);
    return { success: false, error: 'Failed to update blog post' };
  }
}

/**
 * Toggles a blog article's visibility (Hide/Unhide -> Draft/Published).
 */
export async function toggleBlogVisibility(
  id: string,
  newStatus: 'published' | 'draft'
): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    const isPublished = newStatus === 'published';

    // 1. Primary: Prisma DB
    try {
      await db.blogPost.update({
        where: { id },
        data: { published: isPublished },
      });
    } catch (prismaErr) {
      console.warn('[Admin Toggle Blog Visibility Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Secondary: Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        await supabase
          .from('blog_post')
          .update({
            status: newStatus,
            published_at: isPublished ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (supaErr) {
        console.warn('[Admin Toggle Blog Visibility Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/blog');
    safeRevalidate('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Toggle Blog Visibility Error]:', error);
    return { success: false, error: 'Failed to toggle blog visibility' };
  }
}

/**
 * Deletes a blog post record.
 */
export async function deleteBlogPost(id: string): Promise<AdminActionResponse> {
  try {
    await requireAdminUser();
    // 1. Primary: Prisma DB
    try {
      await db.blogPost.delete({
        where: { id },
      });
    } catch (prismaErr) {
      console.warn('[Admin Delete Blog Post Prisma Notice]:', (prismaErr as Error)?.message || prismaErr);
    }

    // 2. Secondary: Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createSupabaseClient();
        await supabase.from('blog_post').delete().eq('id', id);
      } catch (supaErr) {
        console.warn('[Admin Delete Blog Post Supabase Notice]:', (supaErr as Error)?.message || supaErr);
      }
    }

    safeRevalidate('/blog');
    safeRevalidate('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Blog Post Error]:', error);
    return { success: false, error: 'Failed to delete blog post' };
  }
}
