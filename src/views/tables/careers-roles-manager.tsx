'use client';

/**
 * @file admin/src/views/tables/careers-roles-manager.tsx
 * @description [VIEW] Comprehensive 5-Tab management dashboard for Astraiv Careers & Roles.
 */

import { useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AdminJobOpening,
  AdminJobOpeningInput,
  AdminJobApplication,
  JobCategory,
  CareersPageContentData,
  SharedCareersDefaultsData,
} from '@/models/types';
import {
  updateCareersPageContent,
  createJobCategory,
  updateJobCategory,
  deleteJobCategory,
  reorderJobCategory,
  createJobOpening,
  updateJobOpening,
  deleteJobOpening,
  reorderJobOpening,
  toggleJobOpeningStatus,
  updateApplicationStatus,
} from '@/controllers/recruitment.controller';
import {
  Briefcase,
  Layers,
  FolderTree,
  Users,
  Sliders,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Search,
  ExternalLink,
  MapPin,
  CheckCircle2,
  UploadCloud,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
  Info,
  Check,
  Calendar,
  Globe2,
  Code2,
  Brain,
  ShieldCheck,
  Compass,
  HeartHandshake,
  Terminal,
  Cpu,
  Laptop,
  Zap,
  Award,
  Lock,
  Rocket,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

const ICON_ALLOWLIST = [
  { name: 'Compass', icon: Compass },
  { name: 'Users', icon: Users },
  { name: 'HeartHandshake', icon: HeartHandshake },
  { name: 'Globe2', icon: Globe2 },
  { name: 'Code2', icon: Code2 },
  { name: 'Brain', icon: Brain },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Terminal', icon: Terminal },
  { name: 'Cpu', icon: Cpu },
  { name: 'Laptop', icon: Laptop },
  { name: 'Zap', icon: Zap },
  { name: 'Award', icon: Award },
  { name: 'CheckCircle2', icon: CheckCircle2 },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Layers', icon: Layers },
  { name: 'Lock', icon: Lock },
  { name: 'Rocket', icon: Rocket },
  { name: 'Search', icon: Search },
  { name: 'Building2', icon: Building2 },
];

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const match = ICON_ALLOWLIST.find((i) => i.name.toLowerCase() === name.toLowerCase());
  const IconComponent = match ? match.icon : Briefcase;
  return <IconComponent className={className || 'h-4 w-4'} />;
}

interface CareersRolesManagerProps {
  initialPageContent: CareersPageContentData;
  initialSharedDefaults: SharedCareersDefaultsData;
  initialCategories: JobCategory[];
  initialOpenings: AdminJobOpening[];
  initialApplications: AdminJobApplication[];
}

export function CareersRolesManager({
  initialPageContent,
  initialSharedDefaults,
  initialCategories,
  initialOpenings,
  initialApplications,
}: CareersRolesManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'page-content';
  const [, startTransition] = useTransition();

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // State
  const [pageContent, setPageContent] = useState<CareersPageContentData>(initialPageContent);
  const [sharedDefaults, setSharedDefaults] = useState<SharedCareersDefaultsData>(initialSharedDefaults);
  const [categories, setCategories] = useState<JobCategory[]>(initialCategories);
  const [openings, setOpenings] = useState<AdminJobOpening[]>(initialOpenings);
  const [applications, setApplications] = useState<AdminJobApplication[]>(initialApplications);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // =========================================================================
  // TAB 1: PAGE CONTENT STATE & HANDLERS
  // =========================================================================
  const handleSavePageContent = async () => {
    setIsSaving(true);
    try {
      const res = await updateCareersPageContent(pageContent, sharedDefaults);
      if (res.success) {
        showFeedback('success', 'Careers page content and image settings published successfully.');
      } else {
        showFeedback('error', res.error || 'Failed to save page content.');
      }
    } catch {
      showFeedback('error', 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showFeedback('error', 'Image size exceeds the recommended 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setPageContent((prev) => ({
          ...prev,
          careersImage: {
            ...prev.careersImage,
            enabled: true,
            imageUrl: reader.result as string,
            width: img.width,
            height: img.height,
            sizeBytes: file.size,
            sizeLabel: `${(file.size / 1024).toFixed(0)} KB`,
          },
        }));
        showFeedback('success', `Image loaded (${img.width}x${img.height}, ${(file.size / 1024).toFixed(0)} KB)`);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // TAB 2: ROLE CATEGORIES STATE & HANDLERS
  // =========================================================================
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catActive, setCatActive] = useState(true);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatActive(true);
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat: JobCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatActive(cat.active);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSaving(true);
    try {
      if (editingCategory) {
        const res = await updateJobCategory(editingCategory.id, {
          name: catName.trim(),
          active: catActive,
        });
        if (res.success) {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingCategory.id ? { ...c, name: catName.trim(), active: catActive } : c
            )
          );
          setIsCatModalOpen(false);
          showFeedback('success', 'Category updated successfully.');
        } else {
          showFeedback('error', res.error || 'Failed to update category.');
        }
      } else {
        const res = await createJobCategory({
          name: catName.trim(),
          active: catActive,
        });
        if (res.success && res.data) {
          setCategories((prev) => [...prev, res.data as JobCategory]);
          setIsCatModalOpen(false);
          showFeedback('success', 'Category created successfully.');
        } else {
          showFeedback('error', res.error || 'Failed to create category.');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: JobCategory) => {
    const hasOpenings = (cat.openingCount || 0) > 0;
    const promptMsg = hasOpenings
      ? `Category "${cat.name}" is referenced by ${cat.openingCount} active position(s). It will be archived instead of permanently deleted to preserve data integrity. Proceed?`
      : `Are you sure you want to delete "${cat.name}"?`;

    if (!confirm(promptMsg)) return;

    setIsSaving(true);
    try {
      const res = await deleteJobCategory(cat.id);
      if (res.success) {
        if (hasOpenings) {
          setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, active: false } : c)));
          showFeedback('success', res.message || 'Category archived safely.');
        } else {
          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          showFeedback('success', 'Category removed successfully.');
        }
      } else {
        showFeedback('error', res.error || 'Failed to remove category.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorderCategory = async (id: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const copy = [...categories];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setCategories(copy);

    await reorderJobCategory(id, direction);
  };

  // =========================================================================
  // TAB 3: JOB OPENINGS STATE & HANDLERS (ROOMY DRAWER)
  // =========================================================================
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<AdminJobOpening | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  // Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobSlug, setJobSlug] = useState('');
  const [jobCategoryId, setJobCategoryId] = useState('');
  const [jobEmploymentType, setJobEmploymentType] = useState('Full-Time');
  const [jobWorkMode, setJobWorkMode] = useState('Remote');
  const [jobGeographicLocation, setJobGeographicLocation] = useState('Worldwide');
  const [jobExperienceLevel, setJobExperienceLevel] = useState<'Fresher' | 'Experienced' | 'Both'>('Experienced');
  const [jobMinExpYears, setJobMinExpYears] = useState<number | ''>(3);
  const [jobMaxExpYears, setJobMaxExpYears] = useState<number | ''>('');
  const [jobSalary, setJobSalary] = useState('$120,000 - $160,000 + Equity');
  const [jobShowSalary, setJobShowSalary] = useState(true);
  const [jobReferralBonus, setJobReferralBonus] = useState('$2,500');
  const [jobShowReferralBonus, setJobShowReferralBonus] = useState(true);
  const [jobUseSharedDefaults, setJobUseSharedDefaults] = useState(true);
  const [jobDescription, setJobDescription] = useState('');
  const [jobSkillsText, setJobSkillsText] = useState('');
  const [jobResponsibilitiesText, setJobResponsibilitiesText] = useState('');
  const [jobRequirementsText, setJobRequirementsText] = useState('');
  const [jobNiceToHaveText, setJobNiceToHaveText] = useState('');
  const [jobBenefitsText, setJobBenefitsText] = useState('');
  const [jobActive, setJobActive] = useState(true);
  const [jobOrderIndex, setJobOrderIndex] = useState(0);
  const [jobPublishedAt, setJobPublishedAt] = useState('');

  const openCreateJobDrawer = () => {
    setEditingJob(null);
    setJobTitle('');
    setJobSlug('');
    setJobCategoryId(categories[0]?.id || '');
    setJobEmploymentType('Full-Time');
    setJobWorkMode('Remote');
    setJobGeographicLocation('Worldwide');
    setJobExperienceLevel('Experienced');
    setJobMinExpYears(3);
    setJobMaxExpYears('');
    setJobSalary('$120,000 - $160,000 + Equity');
    setJobShowSalary(false);
    setJobReferralBonus('$2,500');
    setJobShowReferralBonus(true);
    setJobUseSharedDefaults(true);
    setJobDescription('');
    setJobSkillsText('Next.js, React, TypeScript, PostgreSQL, Prisma');
    setJobResponsibilitiesText(
      'Design and build high-concurrency software modules adhering to strict architecture guidelines.\nLead architectural RFCs and system design reviews with senior peers.\nEnforce automated testing and sub-second performance budgets.'
    );
    setJobRequirementsText(
      '3+ years of production experience building modern web platforms.\nDeep mastery of TypeScript, Next.js, and relational database systems.\nSolid foundations in asynchronous RFC authoring.'
    );
    setJobNiceToHaveText('Experience with Rust or Go microservices.\nFamiliarity with Cloudflare Workers and R2 storage.');
    setJobBenefitsText('');
    setJobActive(true);
    setJobOrderIndex(openings.length + 1);
    setJobPublishedAt(new Date().toISOString().slice(0, 16));
    setIsJobDrawerOpen(true);
  };

  const openEditJobDrawer = (job: AdminJobOpening) => {
    setEditingJob(job);
    setJobTitle(job.title);
    setJobSlug(job.slug);
    setJobCategoryId(job.categoryId || categories.find((c) => c.name === job.department)?.id || '');
    setJobEmploymentType(job.employmentType || 'Full-Time');
    setJobWorkMode(job.workMode || 'Remote');
    setJobGeographicLocation(job.geographicLocation || 'Worldwide');
    setJobExperienceLevel((job.experienceLevel as 'Fresher' | 'Experienced' | 'Both') || 'Experienced');
    setJobMinExpYears(job.minExperienceYears ?? '');
    setJobMaxExpYears(job.maxExperienceYears ?? '');
    setJobSalary(job.salary || '');
    setJobShowSalary(job.showSalary);
    setJobReferralBonus(job.referralBonus || '$2,500');
    setJobShowReferralBonus(job.showReferralBonus);
    setJobUseSharedDefaults(job.useSharedDefaults);
    setJobDescription(job.description || '');
    setJobSkillsText((job.skills || []).join(', '));
    setJobResponsibilitiesText((job.responsibilities || []).join('\n'));
    setJobRequirementsText((job.requirements || []).join('\n'));
    setJobNiceToHaveText((job.niceToHave || []).join('\n'));
    setJobBenefitsText((job.benefits || []).join('\n'));
    setJobActive(job.active);
    setJobOrderIndex(job.orderIndex);
    setJobPublishedAt(job.publishedAt ? new Date(job.publishedAt).toISOString().slice(0, 16) : '');
    setIsJobDrawerOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim()) {
      showFeedback('error', 'Job Title and Description are required.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === jobCategoryId);
    const departmentName = selectedCategory ? selectedCategory.name : 'Engineering';

    const parsedSkills = jobSkillsText
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedResponsibilities = jobResponsibilitiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedRequirements = jobRequirementsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedNiceToHave = jobNiceToHaveText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedBenefits = jobBenefitsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: AdminJobOpeningInput = {
      title: jobTitle.trim(),
      slug: jobSlug.trim() || undefined,
      categoryId: jobCategoryId || null,
      department: departmentName,
      employmentType: jobEmploymentType,
      workMode: jobWorkMode,
      geographicLocation: jobGeographicLocation.trim() || 'Worldwide',
      experienceLevel: jobExperienceLevel,
      minExperienceYears: jobMinExpYears === '' ? null : Number(jobMinExpYears),
      maxExperienceYears: jobMaxExpYears === '' ? null : Number(jobMaxExpYears),
      experience: jobMinExpYears ? `${jobMinExpYears}+ Years` : jobExperienceLevel,
      description: jobDescription.trim(),
      skills: parsedSkills,
      salary: jobSalary.trim() || null,
      showSalary: jobShowSalary,
      referralBonus: jobReferralBonus.trim() || '$2,500',
      showReferralBonus: jobShowReferralBonus,
      useSharedDefaults: jobUseSharedDefaults,
      responsibilities: parsedResponsibilities,
      requirements: parsedRequirements,
      niceToHave: parsedNiceToHave,
      benefits: parsedBenefits,
      active: jobActive,
      orderIndex: jobOrderIndex,
      publishedAt: jobPublishedAt ? new Date(jobPublishedAt).toISOString() : undefined,
    };

    setIsSaving(true);
    try {
      if (editingJob) {
        const res = await updateJobOpening(editingJob.id, payload);
        if (res.success) {
          setOpenings((prev) =>
            prev.map((j) => (j.id === editingJob.id ? { ...j, ...payload, id: editingJob.id } : j))
          );
          setIsJobDrawerOpen(false);
          showFeedback('success', `Job opening "${jobTitle}" updated successfully.`);
        } else {
          showFeedback('error', res.error || 'Failed to update job opening.');
        }
      } else {
        const res = await createJobOpening(payload);
        if (res.success && res.data) {
          setOpenings((prev) => [...prev, res.data as AdminJobOpening]);
          setIsJobDrawerOpen(false);
          showFeedback('success', `Job opening "${jobTitle}" published successfully.`);
        } else {
          showFeedback('error', res.error || 'Failed to create job opening.');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteJob = async (job: AdminJobOpening) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"? This will immediately remove it from public search.`)) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await deleteJobOpening(job.id);
      if (res.success) {
        setOpenings((prev) => prev.filter((j) => j.id !== job.id));
        showFeedback('success', `Job opening "${job.title}" removed.`);
      } else {
        showFeedback('error', res.error || 'Failed to delete opening.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleJobActive = async (id: string, current: boolean) => {
    const next = !current;
    const res = await toggleJobOpeningStatus(id, next);
    if (res.success) {
      setOpenings((prev) => prev.map((j) => (j.id === id ? { ...j, active: next } : j)));
      showFeedback('success', next ? 'Opening published to public site.' : 'Opening moved to draft.');
    } else {
      showFeedback('error', res.error || 'Failed to toggle status.');
    }
  };

  const handleReorderJob = async (id: string, direction: 'up' | 'down') => {
    const idx = openings.findIndex((j) => j.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= openings.length) return;

    const copy = [...openings];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setOpenings(copy);

    await reorderJobOpening(id, direction);
  };

  // Filtered Job Openings
  const filteredOpenings = openings.filter((j) => {
    const matchesDept = selectedDeptFilter === 'all' || j.department === selectedDeptFilter || j.categoryId === selectedDeptFilter;
    const q = jobSearchQuery.toLowerCase().trim();
    if (!q) return matchesDept;

    return (
      matchesDept &&
      (j.title.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q)))
    );
  });

  // =========================================================================
  // TAB 4: APPLICATIONS INBOX STATE & HANDLERS
  // =========================================================================
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [appTypeFilter, setAppTypeFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<AdminJobApplication | null>(null);

  const filteredApplications = applications.filter((a) => {
    const matchesStatus = appStatusFilter === 'all' || a.status === appStatusFilter;
    const matchesType = appTypeFilter === 'all' || a.type === appTypeFilter;
    const q = appSearchQuery.toLowerCase().trim();
    if (!q) return matchesStatus && matchesType;

    return (
      matchesStatus &&
      matchesType &&
      (a.applicantName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.jobTitle?.toLowerCase().includes(q) ||
        a.applicationNumber.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q))
    );
  });

  const handleUpdateAppStatus = async (
    id: string,
    status: 'pending' | 'reviewed' | 'interview' | 'offered' | 'rejected' | 'archived',
    adminNotes?: string
  ) => {
    const res = await updateApplicationStatus(id, status, adminNotes);
    if (res.success) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status, adminNotes: adminNotes ?? a.adminNotes } : a))
      );
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev) => (prev ? { ...prev, status, adminNotes: adminNotes ?? prev.adminNotes } : null));
      }
      showFeedback('success', `Candidate status updated to ${status}.`);
    } else {
      showFeedback('error', res.error || 'Failed to update application status.');
    }
  };

  // =========================================================================
  // TAB 5: SHARED DEFAULTS STATE & HANDLERS
  // =========================================================================
  const handleSaveSharedDefaults = async () => {
    setIsSaving(true);
    try {
      const res = await updateCareersPageContent(pageContent, sharedDefaults);
      if (res.success) {
        showFeedback('success', 'Shared interview stages and common benefits updated.');
      } else {
        showFeedback('error', res.error || 'Failed to save defaults.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-bold animate-in fade-in slide-in-from-bottom-5',
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/95 border-red-500/50 text-red-200'
          )}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 5-Tab Navigation Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => handleTabChange('page-content')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'page-content'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>1. Page Content</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('categories')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            )}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>2. Role Categories</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('openings')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'openings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            )}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>3. Job Openings</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              {openings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('applications')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'applications'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>4. Applications Inbox</span>
            {applications.filter((a) => a.status === 'pending').length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono">
                {applications.filter((a) => a.status === 'pending').length} New
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('defaults')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'defaults'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>5. Shared Defaults</span>
          </button>
        </div>

        <a
          href="http://localhost:3000/en/careers"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center gap-1.5 shrink-0 ml-3 transition-colors"
        >
          <span>Live Site</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAGE CONTENT */}
      {/* ========================================================================= */}
      {activeTab === 'page-content' && (
        <div className="space-y-6">
          {/* Hero Section Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Careers Landing Hero Section</h3>
                  <p className="text-xs text-slate-400">Main headline, subtitle, and badge on /careers</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Hero Heading (Line breaks preserved) <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={pageContent.heroHeading}
                  onChange={(e) => setPageContent({ ...pageContent, heroHeading: e.target.value })}
                  placeholder="Work With Architects,&#10;Not Bureaucrats."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-medium focus:border-blue-500 resize-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Hero Subtitle</label>
                <textarea
                  rows={3}
                  value={pageContent.heroSubtitle}
                  onChange={(e) => setPageContent({ ...pageContent, heroSubtitle: e.target.value })}
                  placeholder="We are a team of senior software engineers..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Culture Cards (3 Values) */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Core Culture Cards (3 Pillars)</h3>
                <p className="text-xs text-slate-400">Positioned directly below the hero heading</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPageContent({
                    ...pageContent,
                    cultureCards: [
                      ...pageContent.cultureCards,
                      {
                        title: 'New Culture Pillar',
                        body: 'Description of architectural value...',
                        icon: 'Terminal',
                        order: pageContent.cultureCards.length + 1,
                        active: true,
                      },
                    ],
                  })
                }
                className="text-xs h-8 bg-slate-800 border-slate-700 text-slate-200"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Card
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pageContent.cultureCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <select
                        value={card.icon}
                        onChange={(e) => {
                          const updated = [...pageContent.cultureCards];
                          updated[idx].icon = e.target.value;
                          setPageContent({ ...pageContent, cultureCards: updated });
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      >
                        {ICON_ALLOWLIST.map((ic) => (
                          <option key={ic.name} value={ic.name}>
                            {ic.name}
                          </option>
                        ))}
                      </select>
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                        <DynamicIcon name={card.icon} className="h-4 w-4" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = pageContent.cultureCards.filter((_, i) => i !== idx);
                        setPageContent({ ...pageContent, cultureCards: updated });
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => {
                      const updated = [...pageContent.cultureCards];
                      updated[idx].title = e.target.value;
                      setPageContent({ ...pageContent, cultureCards: updated });
                    }}
                    placeholder="Card Title"
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
                  />

                  <textarea
                    rows={3}
                    value={card.body}
                    onChange={(e) => {
                      const updated = [...pageContent.cultureCards];
                      updated[idx].body = e.target.value;
                      setPageContent({ ...pageContent, cultureCards: updated });
                    }}
                    placeholder="Card Description"
                    className="w-full p-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 resize-none leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Careers Image Slot (Optional, between culture and benefits) */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <UploadCloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Careers Landing Feature Image Slot</h3>
                  <p className="text-xs text-slate-400">
                    Optional 16:9 hero image (1600x900 recommended, max 2MB). No gap left when disabled.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pageContent.careersImage.enabled}
                  onChange={(e) =>
                    setPageContent({
                      ...pageContent,
                      careersImage: { ...pageContent.careersImage, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                />
                <span className="text-xs font-bold text-slate-200">Enable Feature Image</span>
              </label>
            </div>

            {pageContent.careersImage.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-blue-500 transition-colors relative">
                    <input
                      type="file"
                      accept="image/webp,image/jpeg,image/png"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-200">
                      Click or drag to upload WebP, JPEG, or PNG
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Recommended: 1600x900 (16:9), under 2 MB limit
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Alt Text (Accessibility & SEO)</label>
                    <Input
                      type="text"
                      value={pageContent.careersImage.altText}
                      onChange={(e) =>
                        setPageContent({
                          ...pageContent,
                          careersImage: { ...pageContent.careersImage, altText: e.target.value },
                        })
                      }
                      placeholder="e.g. Astraiv engineering architects collaborating on cloud architecture"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  {pageContent.careersImage.sizeBytes ? (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
                      <span>Dimensions: {pageContent.careersImage.width}x{pageContent.careersImage.height}px</span>
                      <span>Size: {pageContent.careersImage.sizeLabel}</span>
                    </div>
                  ) : null}
                </div>

                {pageContent.careersImage.imageUrl ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400">Image Preview:</span>
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pageContent.careersImage.imageUrl}
                        alt={pageContent.careersImage.altText}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600 text-xs">
                    No image uploaded yet
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Benefits Heading & 4 Perks */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Benefits & Perks Section</h3>
                <p className="text-xs text-slate-400">Heading, subtitle, and 4 highlight cards</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Benefits Section Heading</label>
                <Input
                  type="text"
                  value={pageContent.benefitsHeading}
                  onChange={(e) => setPageContent({ ...pageContent, benefitsHeading: e.target.value })}
                  placeholder="Build the Future with [Elite Engineers]"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Benefits Section Subtitle</label>
                <Input
                  type="text"
                  value={pageContent.benefitsSubtitle}
                  onChange={(e) => setPageContent({ ...pageContent, benefitsSubtitle: e.target.value })}
                  placeholder="Join our team of elite full-stack engineers..."
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {pageContent.benefitsCards.map((card, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={card.icon}
                      onChange={(e) => {
                        const updated = [...pageContent.benefitsCards];
                        updated[idx].icon = e.target.value;
                        setPageContent({ ...pageContent, benefitsCards: updated });
                      }}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                    >
                      {ICON_ALLOWLIST.map((ic) => (
                        <option key={ic.name} value={ic.name}>
                          {ic.name}
                        </option>
                      ))}
                    </select>
                    <DynamicIcon name={card.icon} className="h-4 w-4 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => {
                      const updated = [...pageContent.benefitsCards];
                      updated[idx].title = e.target.value;
                      setPageContent({ ...pageContent, benefitsCards: updated });
                    }}
                    className="w-full px-2 py-1 text-xs font-bold rounded bg-slate-900 border border-slate-800 text-slate-100"
                  />
                  <textarea
                    rows={3}
                    value={card.body}
                    onChange={(e) => {
                      const updated = [...pageContent.benefitsCards];
                      updated[idx].body = e.target.value;
                      setPageContent({ ...pageContent, benefitsCards: updated });
                    }}
                    className="w-full p-2 text-[11px] rounded bg-slate-900 border border-slate-800 text-slate-300 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities Section Copy */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              Open Opportunities Section & Search Copy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Heading</label>
                <Input
                  type="text"
                  value={pageContent.opportunitiesHeading}
                  onChange={(e) => setPageContent({ ...pageContent, opportunitiesHeading: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Subtitle</label>
                <Input
                  type="text"
                  value={pageContent.opportunitiesSubtitle}
                  onChange={(e) => setPageContent({ ...pageContent, opportunitiesSubtitle: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Search Box Placeholder</label>
                <Input
                  type="text"
                  value={pageContent.searchPlaceholder}
                  onChange={(e) => setPageContent({ ...pageContent, searchPlaceholder: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Empty State Copy</label>
                <Input
                  type="text"
                  value={pageContent.emptyStateCopy}
                  onChange={(e) => setPageContent({ ...pageContent, emptyStateCopy: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Speculative CTA Banner & Application Page Copy */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              Speculative Application Banner & Dedicated Copy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Banner Kicker</label>
                <Input
                  type="text"
                  value={pageContent.speculativeCta.kicker}
                  onChange={(e) =>
                    setPageContent({
                      ...pageContent,
                      speculativeCta: { ...pageContent.speculativeCta, kicker: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Banner Title</label>
                <Input
                  type="text"
                  value={pageContent.speculativeCta.title}
                  onChange={(e) =>
                    setPageContent({
                      ...pageContent,
                      speculativeCta: { ...pageContent.speculativeCta, title: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-300">Banner Body</label>
                <Input
                  type="text"
                  value={pageContent.speculativeCta.body}
                  onChange={(e) =>
                    setPageContent({
                      ...pageContent,
                      speculativeCta: { ...pageContent.speculativeCta, body: e.target.value },
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Save Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSavePageContent}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Publishing Changes...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" /> Save & Publish Page Content
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLE CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-300">Canonical Role Categories Taxonomy</p>
              <p className="mt-0.5 leading-relaxed text-blue-200/80">
                Categories represent engineering disciplines (such as Engineering, AI & Automation, Cloud Ops) used for public filtering. A Job Title identifies a specific opening. Renaming a category updates filters and job cards across client and admin simultaneously.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {categories.length} Canonical Categories
            </span>
            <Button
              onClick={openCreateCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Role Category
            </Button>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-4 px-4 w-20">Order</th>
                  <th className="py-4 px-4">Category Name</th>
                  <th className="py-4 px-4">Slug (URL Parameter)</th>
                  <th className="py-4 px-4">Open Positions</th>
                  <th className="py-4 px-4 w-28">Status</th>
                  <th className="py-4 px-4 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleReorderCategory(cat.id, 'up')}
                            disabled={idx === 0}
                            className="text-slate-500 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderCategory(cat.id, 'down')}
                            disabled={idx === categories.length - 1}
                            className="text-slate-500 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span>#{cat.orderIndex}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-100 text-sm">{cat.name}</span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-400">{cat.slug}</td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {cat.openingCount || 0} Positions
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10.5px] font-bold',
                          cat.active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        )}
                      >
                        {cat.active ? 'Active' : 'Archived'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditCategory(cat)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 cursor-pointer"
                          title="Delete / Archive Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category Create/Edit Modal */}
          {isCatModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">
                    {editingCategory ? 'Edit Role Category' : 'Add Role Category'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Category Name</label>
                    <Input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g. Distributed Systems"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={catActive}
                      onChange={(e) => setCatActive(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                    />
                    <span className="text-xs font-semibold text-slate-300">Visible on Client Filter</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsCatModalOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold">
                      {isSaving ? 'Saving...' : 'Save Category'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: JOB OPENINGS */}
      {/* ========================================================================= */}
      {activeTab === 'openings' && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  placeholder="Search openings, stack..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                    selectedDeptFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  All Roles ({openings.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedDeptFilter(c.name)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                      selectedDeptFilter === c.name
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={openCreateJobDrawer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4 shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Job Opening
            </Button>
          </div>

          {/* Openings Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-4 px-4 w-20">Order</th>
                    <th className="py-4 px-4">Opening Title & Category</th>
                    <th className="py-4 px-4">Location & Modality</th>
                    <th className="py-4 px-4">Experience</th>
                    <th className="py-4 px-4 w-28">Status</th>
                    <th className="py-4 px-4 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOpenings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        No job openings found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOpenings.map((job, idx) => (
                      <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => handleReorderJob(job.id, 'up')}
                                disabled={idx === 0}
                                className="text-slate-500 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderJob(job.id, 'down')}
                                disabled={idx === filteredOpenings.length - 1}
                                className="text-slate-500 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                            <span>#{job.orderIndex}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-100 text-sm">{job.title}</span>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {job.category?.name || job.department}
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">/{job.slug}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-200 font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {job.geographicLocation || 'Worldwide'} · {job.workMode || 'Remote'}
                            </span>
                            <span className="text-[11px] text-slate-500">{job.employmentType || 'Full-Time'}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                            {job.experienceLevel || 'Experienced'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleJobActive(job.id, job.active)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all',
                              job.active
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            )}
                          >
                            {job.active ? (
                              <>
                                <Eye className="h-3 w-3" /> Published
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3" /> Draft
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`http://localhost:3000/en/careers/${job.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Preview on Client Site"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => openEditJobDrawer(job)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                              title="Edit Job Opening"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 cursor-pointer"
                              title="Remove Job Opening"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROOMY JOB EDITOR DRAWER / MODAL */}
          {isJobDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/80 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {editingJob ? `Edit Opening: ${editingJob.title}` : 'Create New Engineering Opening'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Structured specifications, honest geographic metadata, and per-job overrides.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsJobDrawerOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form Body with Smooth Scrolling */}
                <form onSubmit={handleSaveJob} className="p-6 md:p-8 space-y-8 overflow-y-auto grow">
                  {/* Section 1: Basics & Taxonomy */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                      <Sliders className="h-3.5 w-3.5" /> 1. Basics & Role Category
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-300">
                          Job Title <span className="text-red-400">*</span>
                        </label>
                        <Input
                          type="text"
                          required
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Java Full Stack Developer"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Category</label>
                        <select
                          value={jobCategoryId}
                          onChange={(e) => setJobCategoryId(e.target.value)}
                          className="w-full h-9 px-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-blue-500"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Employment Type</label>
                        <select
                          value={jobEmploymentType}
                          onChange={(e) => setJobEmploymentType(e.target.value)}
                          className="w-full h-9 px-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-blue-500"
                        >
                          <option value="Full-Time">Full-Time</option>
                          <option value="Part-Time">Part-Time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Work Mode</label>
                        <select
                          value={jobWorkMode}
                          onChange={(e) => setJobWorkMode(e.target.value)}
                          className="w-full h-9 px-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-blue-500"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="On-site">On-site</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Geographic Eligibility</label>
                        <Input
                          type="text"
                          value={jobGeographicLocation}
                          onChange={(e) => setJobGeographicLocation(e.target.value)}
                          placeholder="e.g. India or Worldwide"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Experience Level</label>
                        <select
                          value={jobExperienceLevel}
                          onChange={(e) =>
                            setJobExperienceLevel(e.target.value as 'Fresher' | 'Experienced' | 'Both')
                          }
                          className="w-full h-9 px-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-blue-500"
                        >
                          <option value="Fresher">Fresher (Zero Experience)</option>
                          <option value="Experienced">Experienced (Senior/Staff)</option>
                          <option value="Both">Both (All backgrounds)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Min Exp Years (Optional)</label>
                        <Input
                          type="number"
                          min={0}
                          value={jobMinExpYears}
                          onChange={(e) => setJobMinExpYears(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="3"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Compensation & Referral */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                      <Award className="h-3.5 w-3.5" /> 2. Compensation & Referral Bonus
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300">Compensation Package (Private / Optional)</label>
                        <Input
                          type="text"
                          value={jobSalary}
                          onChange={(e) => setJobSalary(e.target.value)}
                          placeholder="e.g. $120,000 - $160,000 + Equity"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                        />
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={jobShowSalary}
                            onChange={(e) => setJobShowSalary(e.target.checked)}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                          />
                          <span className="text-xs text-slate-300 font-medium">
                            Display salary publicly on careers card & detail page
                          </span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-300">Candidate Referral Reward</label>
                        <Input
                          type="text"
                          value={jobReferralBonus}
                          onChange={(e) => setJobReferralBonus(e.target.value)}
                          placeholder="$2,500"
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                        />
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={jobShowReferralBonus}
                            onChange={(e) => setJobShowReferralBonus(e.target.checked)}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                          />
                          <span className="text-xs text-slate-300 font-medium">
                            Show referral bonus CTA on job detail sidebar
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Summary, Skills & Repeatable Sections */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" /> 3. Detailed Specifications
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Short Role Summary <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Lead engineering architecture for high-throughput applications..."
                        className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Core Tech Stack & Skills (Comma separated)
                      </label>
                      <Input
                        type="text"
                        value={jobSkillsText}
                        onChange={(e) => setJobSkillsText(e.target.value)}
                        placeholder="Java, Spring Boot, Microservices, PostgreSQL, Docker, AWS"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          Architectural Responsibilities (One item per line)
                        </label>
                        <textarea
                          rows={6}
                          value={jobResponsibilitiesText}
                          onChange={(e) => setJobResponsibilitiesText(e.target.value)}
                          placeholder="Design and implement resilient backend architectures&#10;Lead architectural RFCs..."
                          className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 resize-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          Technical Qualifications & Requirements (One per line)
                        </label>
                        <textarea
                          rows={6}
                          value={jobRequirementsText}
                          onChange={(e) => setJobRequirementsText(e.target.value)}
                          placeholder="Proven experience with Spring Boot & Java 21&#10;Deep understanding of concurrency..."
                          className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 resize-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-300">
                        Bonus / Nice-to-Have Background (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={jobNiceToHaveText}
                        onChange={(e) => setJobNiceToHaveText(e.target.value)}
                        placeholder="Experience with reactive streams&#10;Kubernetes cluster management"
                        className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 resize-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Section 4: Shared Defaults vs Overrides */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 4. Benefits & Interview Roadmap Inheritance
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={jobUseSharedDefaults}
                          onChange={(e) => setJobUseSharedDefaults(e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-200">
                          Use Shared Defaults (Recommended)
                        </span>
                      </label>
                    </div>

                    {!jobUseSharedDefaults && (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <label className="text-xs font-bold text-slate-300">
                          Custom Benefits for this Role (One per line)
                        </label>
                        <textarea
                          rows={4}
                          value={jobBenefitsText}
                          onChange={(e) => setJobBenefitsText(e.target.value)}
                          placeholder="100% remote autonomy&#10;Equipment stipend"
                          className="w-full p-3 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 resize-none font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Section 5: Publishing & Asia/Kolkata Timestamp */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" /> 5. Publishing & Scheduling
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Display Order</label>
                        <Input
                          type="number"
                          min={0}
                          value={jobOrderIndex}
                          onChange={(e) => setJobOrderIndex(Number(e.target.value) || 0)}
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          Published At (Asia/Kolkata)
                        </label>
                        <Input
                          type="datetime-local"
                          value={jobPublishedAt}
                          onChange={(e) => setJobPublishedAt(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2">
                          <input
                            type="checkbox"
                            checked={jobActive}
                            onChange={(e) => setJobActive(e.target.checked)}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                          />
                          <span className="text-xs font-bold text-slate-200">
                            Active (Visible on public site)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsJobDrawerOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-blue-600/25"
                    >
                      {isSaving ? 'Saving...' : editingJob ? 'Update Position' : 'Publish Opening'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CANDIDATE APPLICATIONS INBOX */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder="Search candidate name, email, ref..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1">
                {['all', 'pending', 'reviewed', 'interview', 'offered', 'rejected', 'archived'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAppStatusFilter(st)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer',
                      appStatusFilter === st
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <select
                value={appTypeFilter}
                onChange={(e) => setAppTypeFilter(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
              >
                <option value="all">All Types</option>
                <option value="job">Job Specific</option>
                <option value="speculative">Speculative</option>
              </select>
            </div>

            <span className="text-xs font-mono font-bold text-slate-400">
              {filteredApplications.length} Candidates
            </span>
          </div>

          {/* Applications Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-4 px-4">Ref ID & Date</th>
                    <th className="py-4 px-4">Candidate & Email</th>
                    <th className="py-4 px-4">Target Role / Specialty</th>
                    <th className="py-4 px-4">Location & Exp</th>
                    <th className="py-4 px-4">Resume</th>
                    <th className="py-4 px-4">Pipeline Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                        No applications found in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 font-mono">
                          <span className="font-bold text-slate-200 block">{app.applicationNumber}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-white text-sm block">{app.applicantName}</span>
                          <span className="text-slate-400">{app.email}</span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-blue-400 block">{app.jobTitle}</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {app.type === 'speculative' ? 'Speculative' : 'Opening'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="text-slate-300 block">{app.location}</span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {app.experienceLevel} {app.experienceYears ? `(${app.experienceYears})` : ''}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {app.resumeType === 'upload' && app.resumeStorageKey ? (
                            <a
                              href={`/api/admin/resumes/download?key=${encodeURIComponent(app.resumeStorageKey)}&filename=${encodeURIComponent(app.resumeOriginalName || 'resume.pdf')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 font-bold text-[11px] transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download Resume</span>
                            </a>
                          ) : app.resumeUrl ? (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600/20 font-bold text-[11px] transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>View Cloud Link</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 italic">No document</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleUpdateAppStatus(
                                app.id,
                                e.target.value as 'pending' | 'reviewed' | 'interview' | 'offered' | 'rejected' | 'archived'
                              )
                            }
                            className={cn(
                              'px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border',
                              app.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : app.status === 'interview'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : app.status === 'offered'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : app.status === 'reviewed'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            )}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="rejected">Rejected</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedApp(app)}
                            className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 text-xs font-bold"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CANDIDATE DETAIL DRAWER */}
          {selectedApp && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedApp.applicantName}</h3>
                    <p className="text-xs text-slate-400">Ref: {selectedApp.applicationNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Email</span>
                    <span className="text-slate-200 font-bold">{selectedApp.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <span className="text-slate-200 font-bold">{selectedApp.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location</span>
                    <span className="text-slate-200 font-bold">{selectedApp.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Experience</span>
                    <span className="text-slate-200 font-bold">{selectedApp.experienceLevel}</span>
                  </div>
                </div>

                {selectedApp.candidateNote && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block">
                      Candidate Note:
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                      {selectedApp.candidateNote}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  {selectedApp.resumeType === 'upload' && selectedApp.resumeStorageKey ? (
                    <a
                      href={`/api/admin/resumes/download?key=${encodeURIComponent(selectedApp.resumeStorageKey)}&filename=${encodeURIComponent(selectedApp.resumeOriginalName || 'resume.pdf')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Attached Resume
                    </a>
                  ) : selectedApp.resumeUrl ? (
                    <a
                      href={selectedApp.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open External Link
                    </a>
                  ) : null}

                  <Button variant="ghost" onClick={() => setSelectedApp(null)} className="text-slate-400">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SHARED DEFAULTS */}
      {/* ========================================================================= */}
      {activeTab === 'defaults' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">Transparent 4-Stage Interview Process Defaults</h3>
              <p className="text-xs text-slate-400">
                Inherited by all job detail pages when &quot;Use Shared Defaults&quot; is enabled.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sharedDefaults.interviewStages.map((stage, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-400 text-xs">Stage {stage.num}</span>
                    <input
                      type="text"
                      value={stage.title}
                      onChange={(e) => {
                        const copy = [...sharedDefaults.interviewStages];
                        copy[idx].title = e.target.value;
                        setSharedDefaults({ ...sharedDefaults, interviewStages: copy });
                      }}
                      className="w-full px-2.5 py-1 text-xs font-bold rounded bg-slate-900 border border-slate-800 text-slate-100"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={stage.desc}
                    onChange={(e) => {
                      const copy = [...sharedDefaults.interviewStages];
                      copy[idx].desc = e.target.value;
                      setSharedDefaults({ ...sharedDefaults, interviewStages: copy });
                    }}
                    className="w-full p-2.5 text-xs rounded bg-slate-900 border border-slate-800 text-slate-300 resize-none leading-relaxed"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Common Benefits List (One per line)
              </h4>
              <textarea
                rows={5}
                value={sharedDefaults.commonBenefits.join('\n')}
                onChange={(e) =>
                  setSharedDefaults({
                    ...sharedDefaults,
                    commonBenefits: e.target.value.split('\n').filter(Boolean),
                  })
                }
                className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Default Referral Reward</label>
                <Input
                  type="text"
                  value={sharedDefaults.defaultReferralBonus}
                  onChange={(e) =>
                    setSharedDefaults({ ...sharedDefaults, defaultReferralBonus: e.target.value })
                  }
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Default Privacy Copy</label>
                <Input
                  type="text"
                  value={sharedDefaults.defaultPrivacyText}
                  onChange={(e) =>
                    setSharedDefaults({ ...sharedDefaults, defaultPrivacyText: e.target.value })
                  }
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveSharedDefaults}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-blue-600/20"
              >
                {isSaving ? 'Saving...' : 'Save Shared Defaults'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
