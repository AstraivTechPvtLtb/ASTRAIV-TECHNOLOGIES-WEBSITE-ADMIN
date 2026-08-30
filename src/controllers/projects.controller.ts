'use server';

/**
 * @file admin/src/controllers/projects.controller.ts
 * @description [CONTROLLER] Business logic for managing portfolio case studies and project records.
 */

import { db } from '@/models/db';
import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminProject, AdminProjectInput, AdminActionResponse } from '@/models/types';
import { Prisma } from '@prisma/client';

export interface GetProjectsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Retrieves portfolio projects with filtering.
 */
export async function getProjects({
  search = '',
  status = 'all',
  page = 1,
  limit = 50,
}: GetProjectsParams = {}): Promise<{ data: AdminProject[]; total: number; error?: string }> {
  try {
    const offset = (page - 1) * limit;

    if (!isSupabaseConfigured()) {
      const where: Prisma.PortfolioProjectWhereInput = {};
      if (status !== 'all') {
        where.published = status === 'published';
      }
      if (search.trim()) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, records] = await Promise.all([
        db.portfolioProject.count({ where }),
        db.portfolioProject.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      const mapped: AdminProject[] = records.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        client: 'Direct Partner',
        industry: 'Software & Cloud',
        short_description: p.description,
        description: p.content,
        status: p.published ? 'published' : 'draft',
        featured: false,
        technologies: p.tags,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      }));

      return { data: mapped, total };
    }

    const supabase = await createSupabaseClient();
    let query = supabase.from('projects').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,client.ilike.%${search}%,industry.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    return { data: (data as AdminProject[]) || [], total: count || 0 };
  } catch (error) {
    console.error('[Get Projects Controller Error]:', error);
    return { data: [], total: 0, error: 'Failed to fetch projects' };
  }
}

/**
 * Creates a new portfolio project.
 */
export async function createProject(data: AdminProjectInput): Promise<AdminActionResponse<AdminProject>> {
  try {
    if (!isSupabaseConfigured()) {
      const created = await db.portfolioProject.create({
        data: {
          title: data.title,
          slug: data.slug,
          description: data.short_description || data.title,
          content: data.description || data.short_description || data.title,
          tags: data.technologies || [],
          published: data.status === 'published',
        },
      });

      revalidatePath('/projects');
      revalidatePath('/dashboard');

      return {
        success: true,
        data: {
          id: created.id,
          title: created.title,
          slug: created.slug,
          short_description: created.description,
          description: created.content,
          status: created.published ? 'published' : 'draft',
          featured: data.featured,
          technologies: created.tags,
        },
      };
    }

    const supabase = await createSupabaseClient();
    const { data: created, error } = await supabase
      .from('projects')
      .insert({
        title: data.title,
        slug: data.slug,
        client: data.client,
        industry: data.industry,
        short_description: data.short_description,
        description: data.description,
        status: data.status,
        featured: data.featured,
        metric: data.metric,
        metric_label: data.metric_label,
        services: data.services,
        technologies: data.technologies,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/projects');
    revalidatePath('/dashboard');

    return { success: true, data: created as AdminProject };
  } catch (error) {
    console.error('[Create Project Error]:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

/**
 * Updates an existing portfolio project.
 */
export async function updateProject(
  id: string,
  data: Partial<AdminProjectInput>
): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      const updateData: Prisma.PortfolioProjectUpdateInput = {};
      if (data.title) updateData.title = data.title;
      if (data.slug) updateData.slug = data.slug;
      if (data.short_description || data.description) {
        updateData.description = (data.short_description || data.description) ?? '';
        updateData.content = (data.description || data.short_description) ?? '';
      }
      if (data.technologies) updateData.tags = data.technologies;
      if (data.status) updateData.published = data.status === 'published';

      await db.portfolioProject.update({
        where: { id },
        data: updateData,
      });

      revalidatePath('/projects');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase
      .from('projects')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/projects');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Update Project Error]:', error);
    return { success: false, error: 'Failed to update project' };
  }
}

/**
 * Deletes a portfolio project record.
 */
export async function deleteProject(id: string): Promise<AdminActionResponse> {
  try {
    if (!isSupabaseConfigured()) {
      await db.portfolioProject.delete({
        where: { id },
      });
      revalidatePath('/projects');
      revalidatePath('/dashboard');
      return { success: true };
    }

    const supabase = await createSupabaseClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) throw error;
    revalidatePath('/projects');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Delete Project Error]:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}
