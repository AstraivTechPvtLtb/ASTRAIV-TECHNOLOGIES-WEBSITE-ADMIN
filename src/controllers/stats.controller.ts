'use server';

/**
 * @file admin/src/controllers/stats.controller.ts
 * @description [CONTROLLER] Business logic for aggregating live business telemetry & dashboard statistics.
 */

import { db } from '@/models/db';
import { isSupabaseConfigured, createClient as createSupabaseClient } from '@/models/supabase';
import { AdminDashboardStats } from '@/models/types';

/**
 * Aggregates statistics across inquiries, reviews, projects, services, and articles.
 * Supports both local PostgreSQL via Prisma and Supabase cloud deployments.
 */
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  try {
    // 1. Primary PostgreSQL Engine via Prisma ORM
    if (!isSupabaseConfigured()) {
      const [
        totalEnquiries,
        pendingEnquiries,
        contactedEnquiries,
        closedEnquiries,
        totalReviews,
        pendingReviews,
        approvedReviews,
        featuredReviews,
        publishedProjects,
        draftProjects,
        totalServices,
        publishedBlogs,
      ] = await Promise.all([
        db.contactSubmission.count(),
        db.contactSubmission.count({ where: { status: 'pending' } }),
        db.contactSubmission.count({ where: { status: 'contacted' } }),
        db.contactSubmission.count({ where: { status: 'closed' } }),
        db.review.count(),
        db.review.count({ where: { status: 'pending' } }),
        db.review.count({ where: { status: 'approved' } }),
        db.review.count({ where: { featured: true } }),
        db.portfolioProject.count({ where: { published: true } }),
        db.portfolioProject.count({ where: { published: false } }),
        db.serviceItem.count(),
        db.blogPost.count({ where: { published: true } }),
      ]);

      return {
        totalEnquiries,
        pendingEnquiries,
        contactedEnquiries,
        closedEnquiries,
        totalReviews,
        pendingReviews,
        approvedReviews,
        featuredReviews,
        publishedProjects,
        draftProjects,
        totalServices,
        publishedBlogs,
      };
    }

    // 2. Supabase Fallback for Live Deployed Environments
    const supabase = await createSupabaseClient();
    const [
      enquiriesRes,
      pendingEnquiriesRes,
      contactedEnquiriesRes,
      closedEnquiriesRes,
      reviewsRes,
      pendingReviewsRes,
      approvedReviewsRes,
      featuredReviewsRes,
      publishedProjectsRes,
      draftProjectsRes,
      servicesRes,
      blogsRes,
    ] = await Promise.all([
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'contacted'),
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('featured', true),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    ]);

    return {
      totalEnquiries: enquiriesRes.count || 0,
      pendingEnquiries: pendingEnquiriesRes.count || 0,
      contactedEnquiries: contactedEnquiriesRes.count || 0,
      closedEnquiries: closedEnquiriesRes.count || 0,
      totalReviews: reviewsRes.count || 0,
      pendingReviews: pendingReviewsRes.count || 0,
      approvedReviews: approvedReviewsRes.count || 0,
      featuredReviews: featuredReviewsRes.count || 0,
      publishedProjects: publishedProjectsRes.count || 0,
      draftProjects: draftProjectsRes.count || 0,
      totalServices: servicesRes.count || 0,
      publishedBlogs: blogsRes.count || 0,
    };
  } catch (error) {
    console.error('[Admin Stats Controller Error]:', error);
    return {
      totalEnquiries: 0,
      pendingEnquiries: 0,
      contactedEnquiries: 0,
      closedEnquiries: 0,
      totalReviews: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      featuredReviews: 0,
      publishedProjects: 0,
      draftProjects: 0,
      totalServices: 0,
      publishedBlogs: 0,
    };
  }
}
