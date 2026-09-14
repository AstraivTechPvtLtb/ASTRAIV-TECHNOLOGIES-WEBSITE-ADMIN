/**
 * @file admin/src/models/types.ts
 * @description [MODEL] Admin domain types, telemetry data models, and server response contracts.
 */

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'CLIENT' | 'USER';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type EnquiryStatus = 'pending' | 'contacted' | 'closed' | 'spam';
export type ContentStatus = 'draft' | 'published' | 'archived';

/**
 * Summary telemetry KPIs displayed on the Admin Dashboard overview.
 */
export interface AdminDashboardStats {
  totalEnquiries: number;
  pendingEnquiries: number;
  contactedEnquiries: number;
  closedEnquiries: number;
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  featuredReviews: number;
  publishedProjects: number;
  draftProjects: number;
  totalServices: number;
  activeServices?: number;
  publishedBlogs?: number;
  totalJobOpenings?: number;
  totalPricingPlans?: number;
}

/**
 * Contact enquiry record received from client web forms or external leads.
 */
export interface AdminEnquiry {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  service: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
  updated_at?: string;
}

/**
 * Client review / testimonial record managed in the Admin Portal.
 */
export interface AdminReview {
  id: string;
  source_submission_id?: string | null;
  review_id?: string | null;
  client_name: string;
  company_name?: string | null;
  company?: string | null;
  designation?: string | null;
  project_name?: string | null;
  email?: string | null;
  overall_service_rating?: number | null;
  software_quality_rating?: number | null;
  communication_support_rating?: number | null;
  average_rating: number;
  display_rating: number;
  rating: number;
  liked_most?: string | null;
  would_recommend?: string | null;
  improvement_feedback?: string | null;
  original_review: string;
  review_text: string;
  review: string;
  image_url?: string | null;
  website_publish_permission?: string | null;
  can_publish_review: boolean;
  identity_display_permission?: string | null;
  status: ReviewStatus;
  featured: boolean;
  admin_note?: string | null;
  submitted_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Project / Portfolio case study representation.
 */
export interface AdminProject {
  id: string;
  title: string;
  slug: string;
  client?: string | null;
  industry?: string | null;
  short_description?: string | null;
  description?: string | null;
  status: ContentStatus;
  featured: boolean;
  metric?: string | null;
  metric_label?: string | null;
  services?: string[];
  technologies?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Blog Article representation.
 */
export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  author: string;
  category: string;
  status: ContentStatus;
  cover_image?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Service Catalog item representation.
 */
export interface AdminService {
  id: string;
  title: string;
  slug: string;
  category: string;
  badge?: string | null;
  icon: string;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  status: 'active' | 'draft' | 'archived';
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Input payload for creating or updating portfolio projects.
 */
export interface AdminProjectInput {
  title: string;
  slug: string;
  client?: string | null;
  industry?: string | null;
  short_description?: string | null;
  description?: string | null;
  status: ContentStatus;
  featured: boolean;
  metric?: string | null;
  metric_label?: string | null;
  services?: string[];
  technologies?: string[];
}

/**
 * Input payload for creating or updating service catalog items.
 */
export interface AdminServiceInput {
  title: string;
  slug: string;
  category?: string;
  badge?: string | null;
  icon?: string;
  shortDesc?: string;
  fullDesc?: string;
  features?: string[];
  status?: 'active' | 'draft' | 'archived';
  display_order?: number;
}

/**
 * Input payload for creating or updating blog articles.
 */
export interface AdminBlogInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: string;
  category: string;
  status: ContentStatus;
  cover_image?: string | null;
}

/**
 * Standard server action response envelope.
 */
export interface AdminActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AdminUserSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

/**
 * Footer & Company Contact Settings
 */
export interface AdminFooterSettings {
  id: string;
  brandTagline: string;
  phone: string;
  email: string;
  address: string;
  mapUrl: string | null;
  copyrightText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFooterSettingsInput {
  brandTagline: string;
  phone: string;
  email: string;
  address: string;
  mapUrl?: string | null;
  copyrightText?: string | null;
}

/**
 * Social Media Account Model
 */
export interface AdminSocialLink {
  id: string;
  platform: string;
  name: string;
  url: string;
  icon: string;
  active: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSocialLinkInput {
  platform: string;
  name: string;
  url: string;
  icon: string;
  active?: boolean;
  orderIndex?: number;
}

/**
 * Recruitment / Career Job Opening representation.
 */
export interface AdminJobOpening {
  id: string;
  title: string;
  slug: string;
  department: string;
  type: string;
  location: string;
  experience?: string | null;
  description: string;
  skills: string[];
  salary?: string | null;
  applyUrl?: string | null;
  active: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJobOpeningInput {
  title: string;
  slug?: string;
  department: string;
  type: string;
  location?: string;
  experience?: string | null;
  description: string;
  skills: string[];
  salary?: string | null;
  applyUrl?: string | null;
  active?: boolean;
  orderIndex?: number;
}

/**
 * Service Pricing & Engagement Model representation.
 */
export interface AdminPricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  badge?: string | null;
  isPopular: boolean;
  priceType: 'fixed' | 'custom';
  priceMonthlyInr?: number | null;
  priceYearlyInr?: number | null;
  priceMonthlyUsd?: number | null;
  priceYearlyUsd?: number | null;
  customPriceLabel?: string | null;
  features: string[];
  buttonText: string;
  buttonUrl: string;
  active: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPricingPlanInput {
  name: string;
  slug?: string;
  description: string;
  badge?: string | null;
  isPopular?: boolean;
  priceType: 'fixed' | 'custom';
  priceMonthlyInr?: number | null;
  priceYearlyInr?: number | null;
  priceMonthlyUsd?: number | null;
  priceYearlyUsd?: number | null;
  customPriceLabel?: string | null;
  features: string[];
  buttonText: string;
  buttonUrl?: string;
  active?: boolean;
  orderIndex?: number;
}

/**
 * ISO Compliance & Client Website Performance Section Settings
 */
export interface AdminComplianceSettings {
  id: string;
  isoNumber: string;
  isoLabel: string;
  showIsoBadge: boolean;
  showIsoSection: boolean;
  uptimeValue: string;
  uptimeLabel: string;
  savingsValue: string;
  savingsLabel: string;
  actionsValue: string;
  actionsLabel: string;
  slaValue: string;
  slaLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminComplianceSettingsInput {
  isoNumber: string;
  isoLabel: string;
  showIsoBadge: boolean;
  showIsoSection: boolean;
  uptimeValue?: string;
  uptimeLabel?: string;
  savingsValue?: string;
  savingsLabel?: string;
  actionsValue?: string;
  actionsLabel?: string;
  slaValue?: string;
  slaLabel?: string;
}
