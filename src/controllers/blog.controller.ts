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
      const mapped: AdminBlogPost[] = records.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.summary,
        content: p.content,
        author: p.author?.name || 'AstraIV Engineering Team',
        category: p.category?.name || 'Engineering',
        status: p.published ? 'published' : 'draft',
        cover_image: p.featuredImage,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      }));

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
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return { data: data as AdminBlogPost[] };
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
    let createdPost: AdminBlogPost | null = null;
    const isPublished = data.status === 'published';

    // 1. Primary: Prisma DB
    try {
      let author = await db.user.findFirst({ where: { role: 'ADMIN' } });
      if (!author) {
        author = await db.user.create({
          data: {
            name: data.author || 'AstraIV Admin',
            email: 'admin@astraiv.com',
            emailVerified: true,
            role: 'ADMIN',
          },
        });
      }

      let category = await db.blogCategory.findFirst({ where: { name: data.category } });
      if (!category) {
        category = await db.blogCategory.create({
          data: {
            name: data.category || 'Engineering',
            slug: (data.category || 'engineering').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
        });
      }

      const created = await db.blogPost.create({
        data: {
          title: data.title,
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          summary: data.excerpt || data.title,
          content: data.content,
          published: isPublished,
          featuredImage: data.cover_image || null,
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
        author: created.author?.name || data.author,
        category: created.category?.name || data.category,
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
          .from('blog_posts')
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
    // 1. Primary: Prisma DB
    try {
      const updateData: Prisma.BlogPostUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.excerpt !== undefined) updateData.summary = data.excerpt;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.status !== undefined) updateData.published = data.status === 'published';
      if (data.cover_image !== undefined) updateData.featuredImage = data.cover_image;

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
          .from('blog_posts')
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
          .from('blog_posts')
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
        await supabase.from('blog_posts').delete().eq('id', id);
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
