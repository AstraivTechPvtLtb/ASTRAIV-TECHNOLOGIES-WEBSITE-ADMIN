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
 * Supports both local PostgreSQL via Prisma and Supabase cloud deployments with automatic fallback.
 */
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  // 1. Primary PostgreSQL Engine via Prisma ORM
  try {
    const [
      totalLeads,
      newLeads,
      qualifiedLeads,
      wonLeads,
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
      totalJobOpenings,
      totalPricingPlans,
    ] = await Promise.all([
      db.cRMLead.count(),
      db.cRMLead.count({ where: { status: 'NEW' } }),
      db.cRMLead.count({ where: { status: 'QUALIFIED' } }),
      db.cRMLead.count({ where: { status: 'WON' } }),
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
      db.jobOpening.count(),
      db.pricingPlan.count(),
    ]);

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      wonLeads,
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
      totalJobOpenings,
      totalPricingPlans,
    };
  } catch (prismaErr) {
    console.warn('[Admin Stats Prisma Notice - Falling back]:', (prismaErr as Error)?.message || prismaErr);
  }

  // 2. Supabase Fallback for Live Deployed Environments
  if (isSupabaseConfigured()) {
    try {
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
        supabase.from('portfolio_project').select('*', { count: 'exact', head: true }).eq('published', true),
        supabase.from('portfolio_project').select('*', { count: 'exact', head: true }).eq('published', false),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('blog_post').select('*', { count: 'exact', head: true }).eq('published', true),
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
    } catch (supaErr) {
      console.warn('[Admin Stats Supabase Notice]:', (supaErr as Error)?.message || supaErr);
    }
  }

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
