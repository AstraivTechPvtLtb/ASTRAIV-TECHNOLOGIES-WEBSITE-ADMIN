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

/**
 * Retrieves all blog articles for the admin panel.
 */
export async function getBlogArticles(): Promise<{ data: AdminBlogPost[]; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      const records = await db.blogPost.findMany({
        include: { author: true, category: true },
        orderBy: { createdAt: 'desc' },
      });

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

    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data as AdminBlogPost[]) || [] };
  } catch (error) {
    console.error('[Get Blog Articles Controller Error]:', error);
    return { data: [], error: 'Failed to fetch blog articles' };
  }
}

/**
 * Creates a new blog article.
 */
export async function createBlogPost(data: AdminBlogInput): Promise<AdminActionResponse<AdminBlogPost>> {
  try {
    if (!isSupabaseConfigured()) {
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
            name: data.category || 'General',
            slug: (data.category || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
        });
      }

      const created = await db.blogPost.create({
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.excerpt || data.title,
          content: data.content,
          published: data.status === 'published',
          authorId: author.id,
          categoryId: category.id,
        },
      });

      revalidatePath('/blog');
      revalidatePath('/dashboard');

      return {
        success: true,
        data: {
          id: created.id,
          title: created.title,
          slug: created.slug,
          excerpt: created.summary,
          content: created.content,
          author: author.name,
          category: category.name,
          status: created.published ? 'published' : 'draft',
        },
      };
    }

    const supabase = await createSupabaseClient();
    const { data: created, error } = await supabase
      .from('blog_posts')
      .insert({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        category: data.category,
        status: data.status,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/blog');
    revalidatePath('/dashboard');

    return { success: true, data: created as AdminBlogPost };
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
    if (!isSupabaseConfigured()) {
      const updateData: Prisma.BlogPostUpdateInput = {};
      if (data.title) updateData.title = data.title;
      if (data.slug) updateData.slug = data.slug;
      if (data.excerpt) updateData.summary = data.excerpt;
      if (data.content) updateData.content = data.content;
      if (data.status) updateData.published = data.status === 'published';

      await db.blogPost.update({
        where: { id },
        data: updateData,
      });

      revalidatePath('/blog');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('blog_posts')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/blog');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Update Blog Post Error]:', error);
    return { success: false, error: 'Failed to update blog post' };
  }
}

/**
 * Deletes a blog post record.
 */
export async function deleteBlogPost(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.blogPost.delete({
        where: { id },
      });
      revalidatePath('/blog');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) throw error;
    revalidatePath('/blog');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Blog Post Error]:', error);
    return { success: false, error: 'Failed to delete blog post' };
  }
}
