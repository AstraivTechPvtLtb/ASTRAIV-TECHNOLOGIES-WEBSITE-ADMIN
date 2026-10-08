/**
 * @file admin/src/models/types.ts
 * @description [MODEL] Admin domain types, telemetry data models, and server response contracts.
 */

export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'CLIENT' | 'USER';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type EnquiryStatus = 'pending' | 'contacted' | 'closed' | 'spam';
export type ContentStatus = 'draft' | 'published' | 'archived';

/**
 * Recommended 7-stage Lead Lifecycle.
 */
export type LeadLifecycleStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export const DEFAULT_ADMIN_EMAIL = 'astraivtechnologies@gmail.com';

/**
 * Summary telemetry KPIs displayed on the Admin Dashboard overview.
 */
export interface AdminDashboardStats {
  totalLeads?: number;
  newLeads?: number;
  qualifiedLeads?: number;
  wonLeads?: number;
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
 * Prospective enterprise lead captured via Start a Project wizard or website inbound funnels.
 */
export interface AdminLead {
  id: string;
  lead_number: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service_id?: string | null;
  solution_id?: string | null;
  industry_id?: string | null;
  project_description?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  source_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  status: LeadLifecycleStatus;
  assigned_to?: string | null;
  assigned_user_name?: string | null;
  notes?: string | null;
  portal_approved?: boolean;
  portal_password?: string | null;
  approved_at?: string | null;
  first_login_expires_at?: string | null;
  has_logged_in?: boolean;
  first_logged_in_at?: string | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Analytics and conversion funnel metrics for CRM Leads.
 */
export interface AdminLeadAnalytics {
  totalLeads: number;
  statusBreakdown: Record<LeadLifecycleStatus, number>;
  conversionRate: number; // Won / Total * 100
  topSourcePages: Array<{ page: string; count: number; wonCount: number }>;
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
  avatar?: string | null;
  role?: string | null;
  project_id?: string | null;
  service_id?: string | null;
  industry_id?: string | null;
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
export type BlogSectionType = 'engineering' | 'ai-research';

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  author: string;
  author_role?: string | null;
  author_image?: string | null;
  reading_time?: string | null;
  category: string;
  section?: BlogSectionType;
  tags?: string[];
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
  author_role?: string | null;
  author_image?: string | null;
  reading_time?: string | null;
  category: string;
  section?: BlogSectionType;
  tags?: string[];
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

export interface JobCategory {
  id: string;
  name: string;
  slug: string;
  orderIndex: number;
  active: boolean;
  openingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobCategoryInput {
  name: string;
  slug?: string;
  orderIndex?: number;
  active?: boolean;
}

/**
 * Recruitment / Career Job Opening representation.
 */
export interface AdminJobOpening {
  id: string;
  categoryId?: string | null;
  category?: JobCategory | null;
  title: string;
  slug: string;
  department: string;
  employmentType: string;
  workMode: string;
  geographicLocation: string;
  experienceLevel: 'Fresher' | 'Experienced' | 'Both' | string;
  experience?: string | null;
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
  type?: string | null;
  location?: string | null;
  description: string;
  skills: string[];
  salary?: string | null;
  showSalary: boolean;
  applyUrl?: string | null;
  active: boolean;
  orderIndex: number;
  publishedAt?: string | null;
  referralBonus?: string | null;
  showReferralBonus: boolean;
  useSharedDefaults: boolean;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  benefits?: string[];
  interviewStages?: Array<{ num: string; title: string; desc: string }>;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJobOpeningInput {
  categoryId?: string | null;
  title: string;
  slug?: string;
  department?: string;
  employmentType?: string;
  workMode?: string;
  geographicLocation?: string;
  experienceLevel?: 'Fresher' | 'Experienced' | 'Both' | string;
  experience?: string | null;
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
  type?: string;
  location?: string;
  description: string;
  skills: string[];
  salary?: string | null;
  showSalary?: boolean;
  applyUrl?: string | null;
  active?: boolean;
  orderIndex?: number;
  publishedAt?: string | null;
  referralBonus?: string | null;
  showReferralBonus?: boolean;
  useSharedDefaults?: boolean;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  benefits?: string[];
  interviewStages?: Array<{ num: string; title: string; desc: string }>;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface AdminJobApplication {
  id: string;
  applicationNumber: string;
  type: 'job' | 'speculative';
  jobId?: string | null;
  jobTitle?: string | null;
  applicantName: string;
  email: string;
  phone?: string | null;
  location: string;
  experienceLevel: string;
  experienceYears?: string | null;
  categoryInterests?: string[];
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  resumeType: 'upload' | 'link';
  resumeStorageProvider?: string | null;
  resumeStorageBucket?: string | null;
  resumeStorageKey?: string | null;
  resumeOriginalName?: string | null;
  resumeMimeType?: string | null;
  resumeSizeBytes?: number | null;
  resumeUrl?: string | null;
  role?: string;
  candidateNote?: string | null;
  notes?: string | null;
  privacyConsent: boolean;
  status: 'pending' | 'reviewed' | 'interview' | 'offered' | 'hired' | 'rejected' | 'archived' | string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CultureCardItem {
  id?: string;
  title: string;
  body: string;
  icon: string;
  order: number;
  active: boolean;
}

export interface BenefitsCardItem {
  id?: string;
  title: string;
  body: string;
  icon: string;
  order: number;
  active: boolean;
}

export interface CareersImageSettings {
  enabled: boolean;
  imageUrl: string;
  altText: string;
  focalPoint?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  sizeLabel?: string;
}

export interface CareersPageContentData {
  heroHeading: string;
  heroSubtitle: string;
  cultureCards: CultureCardItem[];
  careersImage: CareersImageSettings;
  benefitsHeading: string;
  benefitsSubtitle: string;
  benefitsCards: BenefitsCardItem[];
  opportunitiesHeading: string;
  opportunitiesSubtitle: string;
  searchPlaceholder: string;
  emptyStateCopy: string;
  speculativeCta: {
    enabled: boolean;
    kicker: string;
    title: string;
    body: string;
    buttonText: string;
    buttonUrl: string;
  };
  speculativePageCopy: {
    heading: string;
    subheading: string;
    supportGuidance: string;
    successMessage: string;
  };
}

export interface SharedCareersDefaultsData {
  interviewStages: Array<{ num: string; title: string; desc: string }>;
  commonBenefits: string[];
  defaultReferralBonus: string;
  defaultPrivacyText: string;
}

export interface AdminPricingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  badge?: string | null;
  isPopular: boolean;
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
  features: string[];
  buttonText: string;
  buttonUrl?: string;
  active?: boolean;
  orderIndex?: number;
}

/**
 * Admin Engagement Models Page Image & Header Settings.
 */
export interface AdminPricingPageSettings {
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  showHeroImage: boolean;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageSizeBytes?: number | null;
  imageSizeLabel?: string | null;
}

export const DEFAULT_ADMIN_PRICING_PAGE_SETTINGS: AdminPricingPageSettings = {
  heroImageUrl: '/images/engagement-models-hero.jpg',
  heroImageAlt: 'Astraiv Technologies engineering team collaborating on system architecture and milestone roadmaps',
  showHeroImage: true,
  imageWidth: 1792,
  imageHeight: 1008,
  imageSizeBytes: 752053,
  imageSizeLabel: '734 KB',
};

/**
 * Enterprise client partner logo item for the proof ticker
 */
export interface ClientLogoItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  iconKey?: string;
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
  clientLogos?: ClientLogoItem[];
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
  clientLogos?: ClientLogoItem[] | string;
}

/**
 * Relational CMS Admin Control Types
 */
export interface CmsEntityPublicationUpdate {
  id: string;
  status?: 'published' | 'draft' | 'archived' | 'active';
  published?: boolean;
  active?: boolean;
}

export interface CmsEntityFeaturedUpdate {
  id: string;
  featured: boolean;
}

export interface CmsEntityOrderUpdate {
  id: string;
  orderIndex: number;
}

export interface CmsEntitySeoUpdate {
  id: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface CmsEntityRelationshipUpdate {
  sourceEntityType: 'service' | 'solution' | 'industry' | 'case_study' | 'article';
  sourceId: string;
  targetEntityType: 'service' | 'solution' | 'industry' | 'technology' | 'case_study' | 'article';
  targetIds: string[];
}
