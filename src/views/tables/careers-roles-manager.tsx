'use client';

/**
 * @file admin/src/views/tables/careers-roles-manager.tsx
 * @description [VIEW] Comprehensive 5-Tab management dashboard for Astraiv Careers & Roles.
 */

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
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
import { registerMediaAsset, sanitizeSvgContent } from '@/controllers/media.controller';
import { MEDIA_SLOT_SPECS, MediaAssetItem } from '@/lib/media-specs';
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
  Image as ImageIcon,
  FolderOpen,
  UserCheck,
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
  mediaAssets?: MediaAssetItem[];
}

export function CareersRolesManager({
  initialPageContent,
  initialSharedDefaults,
  initialCategories,
  initialOpenings,
  initialApplications,
  mediaAssets = [],
}: CareersRolesManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'page-content';
  const activeTab = rawTab === 'defaults' ? 'page-content' : rawTab;
  const [, startTransition] = useTransition();

  const slotSpec = MEDIA_SLOT_SPECS.careers_hero || MEDIA_SLOT_SPECS.engagement_hero;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speculativeFileInputRef = useRef<HTMLInputElement>(null);
  const jobDetailFileInputRef = useRef<HTMLInputElement>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'careers_hero' | 'speculative_banner' | 'job_detail_banner'>('careers_hero');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > slotSpec.maxSizeBytes) {
      showFeedback('error', `File size exceeds the recommended limit of ${slotSpec.maxSizeLabel}. Please compress your image.`);
      return;
    }

    const isSvg = file.type.includes('svg');
    let finalDataUrl = '';

    if (isSvg) {
      try {
        const text = await file.text();
        const sanitized = await sanitizeSvgContent(text);
        const encoded = window.btoa(unescape(encodeURIComponent(sanitized)));
        finalDataUrl = `data:image/svg+xml;base64,${encoded}`;
      } catch (err: unknown) {
        showFeedback('error', (err as Error)?.message || 'SVG validation failed. Please upload a valid, safe SVG file.');
        return;
      }
    }

    const processUpload = (dataUrl: string) => {
      const img = new window.Image();
      img.onload = async () => {
        const sizeKb = Math.round(file.size / 1024);
        const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;

        const updatedCareersImage = {
          ...pageContent.careersImage,
          enabled: true,
          imageUrl: dataUrl,
          width: img.width || 1792,
          height: img.height || 1008,
          sizeBytes: file.size,
          sizeLabel: sizeLabel,
          altText:
            pageContent.careersImage?.altText ||
            'Astraiv Technologies engineering team collaborating on software architecture and system design in modern tech studio',
        };

        const updatedPageContent = {
          ...pageContent,
          careersImage: updatedCareersImage,
        };

        setPageContent(updatedPageContent);
        setIsSaving(true);

        // Register in media library for traceability
        try {
          await registerMediaAsset({
            url: dataUrl,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            width: img.width,
            height: img.height,
            aspectRatio: '16:9',
            altText: updatedCareersImage.altText,
            slot: 'careers_hero',
          });
        } catch (regErr) {
          console.warn('[MediaAsset Registration Notice]:', regErr);
        }

        // Auto-save settings to database
        try {
          const res = await updateCareersPageContent(updatedPageContent, sharedDefaults);
          if (res.success) {
            showFeedback('success', 'Uploaded new careers hero image and published to client website!');
          } else {
            showFeedback('error', res.error || 'Failed to save uploaded image.');
          }
        } catch (err) {
          console.warn('[Auto-save Upload Error]:', err);
          showFeedback('error', 'An error occurred while saving.');
        } finally {
          setIsSaving(false);
        }
      };
      img.src = dataUrl;
    };

    if (finalDataUrl) {
      processUpload(finalDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => processUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectMediaAsset = async (asset: MediaAssetItem) => {
    const sizeKb = Math.round(asset.sizeBytes / 1024);
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;

    if (mediaPickerTarget === 'job_detail_banner') {
      const updatedJobDetailImage = {
        ...(sharedDefaults.jobDetailImage || {}),
        enabled: true,
        imageUrl: asset.url,
        width: asset.width || 1792,
        height: asset.height || 1008,
        sizeBytes: asset.sizeBytes,
        sizeLabel: sizeLabel,
        altText:
          asset.altText ||
          sharedDefaults.jobDetailImage?.altText ||
          'Astraiv Technologies senior software architects and experienced full-stack engineers collaborating on cloud-native systems architecture',
        badgeText: sharedDefaults.jobDetailImage?.badgeText || 'Elite Senior Architecture Swarm',
        badgeSubtext: sharedDefaults.jobDetailImage?.badgeSubtext || 'High Autonomy & Systems Impact',
      };
      const updatedSharedDefaults = {
        ...sharedDefaults,
        jobDetailImage: updatedJobDetailImage,
      };
      setSharedDefaults(updatedSharedDefaults);
      setIsMediaPickerOpen(false);
      setIsSaving(true);

      try {
        const res = await updateCareersPageContent(pageContent, updatedSharedDefaults);
        if (res.success) {
          showFeedback('success', 'Selected experienced team banner from Media Library and published!');
        } else {
          showFeedback('error', res.error || 'Failed to update job detail banner from Media Library.');
        }
      } catch (err) {
        showFeedback('error', (err as Error)?.message || 'Failed to update image from Media Library.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    let updatedPageContent: CareersPageContentData;

    if (mediaPickerTarget === 'speculative_banner') {
      const updatedSpeculativeImage = {
        ...(pageContent.speculativeImage || {}),
        enabled: true,
        imageUrl: asset.url,
        width: asset.width || 1792,
        height: asset.height || 1008,
        sizeBytes: asset.sizeBytes,
        sizeLabel: sizeLabel,
        altText: asset.altText || pageContent.speculativeImage?.altText || 'Astraiv Technologies engineering architects and emerging engineers collaborating',
      };
      updatedPageContent = {
        ...pageContent,
        speculativeImage: updatedSpeculativeImage,
      };
    } else {
      const updatedCareersImage = {
        ...pageContent.careersImage,
        enabled: true,
        imageUrl: asset.url,
        width: asset.width || 1792,
        height: asset.height || 1008,
        sizeBytes: asset.sizeBytes,
        sizeLabel: sizeLabel,
        altText: asset.altText || pageContent.careersImage?.altText || 'Astraiv Technologies engineering architects collaborating on cloud architecture',
      };
      updatedPageContent = {
        ...pageContent,
        careersImage: updatedCareersImage,
      };
    }

    setPageContent(updatedPageContent);
    setIsMediaPickerOpen(false);
    setIsSaving(true);

    try {
      const res = await updateCareersPageContent(updatedPageContent, sharedDefaults);
      if (res.success) {
        showFeedback('success', 'Selected image from Media Library and published to client website!');
      } else {
        showFeedback('error', res.error || 'Failed to update image from Media Library.');
      }
    } catch (err) {
      showFeedback('error', (err as Error)?.message || 'Failed to update image from Media Library.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpeculativeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > slotSpec.maxSizeBytes) {
      showFeedback('error', `File size exceeds the limit of ${slotSpec.maxSizeLabel}. Please compress your image.`);
      return;
    }

    const isSvg = file.type.includes('svg');
    let finalDataUrl = '';

    if (isSvg) {
      try {
        const text = await file.text();
        const sanitized = await sanitizeSvgContent(text);
        const encoded = window.btoa(unescape(encodeURIComponent(sanitized)));
        finalDataUrl = `data:image/svg+xml;base64,${encoded}`;
      } catch (err: unknown) {
        showFeedback('error', (err as Error)?.message || 'SVG validation failed. Please upload a valid, safe SVG file.');
        return;
      }
    }

    const processUpload = (dataUrl: string) => {
      const img = new window.Image();
      img.onload = async () => {
        const sizeKb = Math.round(file.size / 1024);
        const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;

        const updatedSpeculativeImage = {
          ...(pageContent.speculativeImage || {}),
          enabled: true,
          imageUrl: dataUrl,
          width: img.width || 1792,
          height: img.height || 1008,
          sizeBytes: file.size,
          sizeLabel: sizeLabel,
          altText:
            pageContent.speculativeImage?.altText ||
            'Astraiv Technologies engineering architects and emerging engineers collaborating on software architecture',
          badgeText: pageContent.speculativeImage?.badgeText || 'Open Engineering Swarm',
          badgeSubtext: pageContent.speculativeImage?.badgeSubtext || 'Fresher & Experienced',
        };

        const updatedPageContent = {
          ...pageContent,
          speculativeImage: updatedSpeculativeImage,
        };

        setPageContent(updatedPageContent);
        setIsSaving(true);

        try {
          await registerMediaAsset({
            url: dataUrl,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            width: img.width,
            height: img.height,
            aspectRatio: '16:9',
            altText: updatedSpeculativeImage.altText,
            slot: 'careers_hero',
          });
        } catch (regErr) {
          console.warn('[MediaAsset Registration Notice]:', regErr);
        }

        try {
          const res = await updateCareersPageContent(updatedPageContent, sharedDefaults);
          if (res.success) {
            showFeedback('success', 'Uploaded new speculative team image and published to client website!');
          } else {
            showFeedback('error', res.error || 'Failed to save uploaded speculative image.');
          }
        } catch {
          showFeedback('error', 'An error occurred while saving.');
        } finally {
          setIsSaving(false);
        }
      };
      img.src = dataUrl;
    };

    if (finalDataUrl) {
      processUpload(finalDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => processUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleToggleShowSpeculativeImage = async (checked: boolean) => {
    const updatedSpeculativeImage = {
      ...(pageContent.speculativeImage || {
        imageUrl: '/images/speculative-team-banner.jpg',
        altText: 'Astraiv Technologies engineering architects and emerging engineers collaborating on software architecture',
      }),
      enabled: checked,
    };

    const updatedPageContent = {
      ...pageContent,
      speculativeImage: updatedSpeculativeImage,
    };

    setPageContent(updatedPageContent);
    setIsSaving(true);

    try {
      const res = await updateCareersPageContent(updatedPageContent, sharedDefaults);
      if (res.success) {
        showFeedback(
          'success',
          checked
            ? 'Speculative application image is now visible on the client website!'
            : 'Speculative application image is now hidden from the client website.'
        );
      } else {
        setPageContent(pageContent);
        showFeedback('error', res.error || 'Failed to update speculative image visibility.');
      }
    } catch (err) {
      setPageContent(pageContent);
      showFeedback('error', (err as Error)?.message || 'An error occurred while toggling visibility.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSpeculativeImage = async () => {
    if (!confirm('Are you sure you want to remove the speculative page image? This will hide the image from the client website.')) {
      return;
    }

    const updatedSpeculativeImage = {
      ...(pageContent.speculativeImage || {}),
      enabled: false,
      imageUrl: '',
      altText: pageContent.speculativeImage?.altText || 'Astraiv Technologies Emerging Engineers and Senior Architects collaborating',
      width: undefined,
      height: undefined,
      sizeBytes: undefined,
      sizeLabel: undefined,
    };

    const updatedPageContent = {
      ...pageContent,
      speculativeImage: updatedSpeculativeImage,
    };

    setPageContent(updatedPageContent);
    setIsSaving(true);

    try {
      const res = await updateCareersPageContent(updatedPageContent, sharedDefaults);
      if (res.success) {
        showFeedback('success', 'Speculative page image removed successfully from the client website.');
      } else {
        showFeedback('error', res.error || 'Failed to remove speculative image.');
      }
    } catch (err) {
      showFeedback('error', (err as Error)?.message || 'Failed to remove speculative image.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove the careers page image? This will hide and remove the image container from the client website.')) {
      return;
    }

    const updatedCareersImage = {
      ...pageContent.careersImage,
      enabled: false,
      imageUrl: '',
      width: undefined,
      height: undefined,
      sizeBytes: undefined,
      sizeLabel: undefined,
    };

    const updatedPageContent = {
      ...pageContent,
      careersImage: updatedCareersImage,
    };

    setPageContent(updatedPageContent);
    setIsSaving(true);

    try {
      const res = await updateCareersPageContent(updatedPageContent, sharedDefaults);
      if (res.success) {
        showFeedback('success', 'Careers page image removed successfully from the client website.');
      } else {
        showFeedback('error', res.error || 'Failed to remove image.');
      }
    } catch (err) {
      showFeedback('error', (err as Error)?.message || 'Failed to remove image.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleShowImage = async (checked: boolean) => {
    const updatedCareersImage = {
      ...pageContent.careersImage,
      enabled: checked,
    };

    const updatedPageContent = {
      ...pageContent,
      careersImage: updatedCareersImage,
    };

    setPageContent(updatedPageContent);
    setIsSaving(true);

    try {
      const res = await updateCareersPageContent(updatedPageContent, sharedDefaults);
      if (res.success) {
        showFeedback(
          'success',
          checked
            ? 'Careers page image is now visible on the client website!'
            : 'Careers page image is now hidden from the client website.'
        );
      } else {
        // Rollback
        setPageContent(pageContent);
        showFeedback('error', res.error || 'Failed to update image visibility.');
      }
    } catch (err) {
      setPageContent(pageContent);
      showFeedback('error', (err as Error)?.message || 'An error occurred while toggling visibility.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveImageSettings = async () => {
    setIsSaving(true);
    try {
      const res = await updateCareersPageContent(pageContent, sharedDefaults);
      if (res.success) {
        showFeedback('success', 'Careers page image settings saved and published successfully!');
      } else {
        showFeedback('error', res.error || 'Failed to save page image settings.');
      }
    } catch (err) {
      showFeedback('error', (err as Error)?.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleJobDetailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > slotSpec.maxSizeBytes) {
      showFeedback('error', `File size exceeds the limit of ${slotSpec.maxSizeLabel}. Please compress your image.`);
      return;
    }

    const isSvg = file.type.includes('svg');
    let finalDataUrl = '';

    if (isSvg) {
      try {
        const text = await file.text();
        const sanitized = await sanitizeSvgContent(text);
        const encoded = window.btoa(unescape(encodeURIComponent(sanitized)));
        finalDataUrl = `data:image/svg+xml;base64,${encoded}`;
      } catch (err: unknown) {
        showFeedback('error', (err as Error)?.message || 'SVG validation failed. Please upload a valid, safe SVG file.');
        return;
      }
    }

    const processUpload = (dataUrl: string) => {
      const img = new window.Image();
      img.onload = async () => {
        const sizeKb = Math.round(file.size / 1024);
        const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;

        const updatedJobDetailImage = {
          ...(sharedDefaults.jobDetailImage || {}),
          enabled: true,
          imageUrl: dataUrl,
          width: img.width || 1792,
          height: img.height || 1008,
          sizeBytes: file.size,
          sizeLabel: sizeLabel,
          altText:
            sharedDefaults.jobDetailImage?.altText ||
            'Astraiv Technologies senior software architects and experienced full-stack engineers collaborating on cloud-native systems architecture',
          badgeText: sharedDefaults.jobDetailImage?.badgeText || 'Elite Senior Architecture Swarm',
          badgeSubtext: sharedDefaults.jobDetailImage?.badgeSubtext || 'High Autonomy & Systems Impact',
        };

        const updatedSharedDefaults = {
          ...sharedDefaults,
          jobDetailImage: updatedJobDetailImage,
        };

        setSharedDefaults(updatedSharedDefaults);
        setIsSaving(true);

        try {
          await registerMediaAsset({
            url: dataUrl,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            width: img.width,
            height: img.height,
            aspectRatio: '16:9',
            altText: updatedJobDetailImage.altText,
            slot: 'careers_hero',
          });
        } catch (regErr) {
          console.warn('[MediaAsset Registration Notice]:', regErr);
        }

        try {
          const res = await updateCareersPageContent(pageContent, updatedSharedDefaults);
          if (res.success) {
            showFeedback('success', 'Uploaded new experienced engineers banner and published to all job detail pages!');
          } else {
            showFeedback('error', res.error || 'Failed to save uploaded banner.');
          }
        } catch {
          showFeedback('error', 'An error occurred while saving.');
        } finally {
          setIsSaving(false);
        }
      };
      img.src = dataUrl;
    };

    if (finalDataUrl) {
      processUpload(finalDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = () => processUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleToggleShowJobDetailImage = async (checked: boolean) => {
    const updatedJobDetailImage = {
      ...(sharedDefaults.jobDetailImage || {
        imageUrl: '/images/experienced-engineers-banner.jpg',
        altText: 'Astraiv Technologies senior software architects collaborating',
      }),
      enabled: checked,
    };

    const updatedSharedDefaults = {
      ...sharedDefaults,
      jobDetailImage: updatedJobDetailImage,
    };

    setSharedDefaults(updatedSharedDefaults);
    setIsSaving(true);

    try {
      const res = await updateCareersPageContent(pageContent, updatedSharedDefaults);
      if (res.success) {
        showFeedback(
          'success',
          checked
            ? 'Experienced team banner is now visible on all job detail pages!'
            : 'Experienced team banner is now hidden from all job detail pages.'
        );
      } else {
        setSharedDefaults(sharedDefaults);
        showFeedback('error', res.error || 'Failed to update image visibility.');
      }
    } catch (err) {
      setSharedDefaults(sharedDefaults);
      showFeedback('error', (err as Error)?.message || 'An error occurred while toggling visibility.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveJobDetailImage = async () => {
    if (!confirm('Are you sure you want to remove the experienced team banner? This will hide the banner from all job detail pages.')) {
      return;
    }

    const updatedJobDetailImage = {
      ...(sharedDefaults.jobDetailImage || {}),
      enabled: false,
      imageUrl: '',
      altText: sharedDefaults.jobDetailImage?.altText || 'Astraiv Technologies senior software architects collaborating',
      width: undefined,
      height: undefined,
      sizeBytes: undefined,
      sizeLabel: undefined,
    };

    const updatedSharedDefaults = {
      ...sharedDefaults,
      jobDetailImage: updatedJobDetailImage,
    };

    setSharedDefaults(updatedSharedDefaults);
    setIsSaving(true);

    try {
      const res = await updateCareersPageContent(pageContent, updatedSharedDefaults);
      if (res.success) {
        showFeedback('success', 'Experienced team banner removed from all job detail pages.');
      } else {
        showFeedback('error', res.error || 'Failed to remove image.');
      }
    } catch (err) {
      showFeedback('error', (err as Error)?.message || 'Failed to remove image.');
    } finally {
      setIsSaving(false);
    }
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

      {/* 4-Tab Navigation Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-lg overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => handleTabChange('page-content')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
              activeTab === 'page-content'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80'
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
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80'
            )}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>2. Role Categories</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
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
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80'
            )}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>3. Job Openings</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono">
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
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80'
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
        </div>

        <a
          href="http://localhost:3000/en/careers"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 shrink-0 ml-3 transition-colors border border-slate-200 dark:border-slate-700"
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
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Master Careers & Speculative Hero Section</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                      Syncs /careers & /contact?type=speculative
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Primary headline and subtitle shared across both the Careers Portal and Speculative Recruitment views.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hero Heading (Line breaks preserved) <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={pageContent.heroHeading}
                  onChange={(e) => setPageContent({ ...pageContent, heroHeading: e.target.value })}
                  placeholder="Work With Architects,&#10;Not Bureaucrats."
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-medium focus:border-blue-500 resize-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hero Subtitle</label>
                <textarea
                  rows={3}
                  value={pageContent.heroSubtitle}
                  onChange={(e) => setPageContent({ ...pageContent, heroSubtitle: e.target.value })}
                  placeholder="We are a team of senior software engineers..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Culture Cards (3 Values) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-5">
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

          {/* Careers & Roles Page Image Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Careers & Roles Page Image
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                      pageContent.careersImage?.enabled && pageContent.careersImage?.imageUrl
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    )}
                  >
                    {pageContent.careersImage?.enabled && pageContent.careersImage?.imageUrl
                      ? 'Visible on Website'
                      : 'Hidden'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Admin-managed hero illustration rendered between the culture pillars and benefits section on the client website.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={handleSaveImageSettings}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Save Page Image Settings
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Image Preview Box */}
              <div className="lg:col-span-6 space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 aspect-16/9 flex items-center justify-center group shadow-inner">
                  {pageContent.careersImage?.imageUrl ? (
                    <>
                      <Image
                        src={pageContent.careersImage.imageUrl}
                        alt={pageContent.careersImage.altText || 'Careers & Roles Hero Image'}
                        fill
                        className={cn(
                          'object-cover transition-opacity duration-300',
                          !pageContent.careersImage.enabled && 'opacity-40 grayscale'
                        )}
                        unoptimized
                      />
                      {!pageContent.careersImage.enabled && (
                        <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                            <EyeOff className="h-3.5 w-3.5 text-amber-400" /> Image is Currently Hidden
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-500">
                      <ImageIcon className="h-10 w-10 text-slate-600 stroke-1" />
                      <p className="text-xs font-semibold">No Image Selected</p>
                      <p className="text-[11px] text-slate-600 max-w-xs">
                        Upload an image or choose an existing asset from the Media Library.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actual Asset Metrics Bar */}
                {pageContent.careersImage?.imageUrl && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>
                        Dimensions:{' '}
                        <strong className="text-slate-200 font-mono">
                          {pageContent.careersImage.width || 1792} × {pageContent.careersImage.height || 1008} px
                        </strong>
                      </span>
                      <span>
                        Size:{' '}
                        <strong className="text-slate-200 font-mono">
                          {pageContent.careersImage.sizeLabel || '820 KB'}
                        </strong>
                      </span>
                    </div>
                    <span className="font-mono text-blue-400">Aspect 16:9</span>
                  </div>
                )}
              </div>

              {/* Image Settings & Actions */}
              <div className="lg:col-span-6 space-y-4">
                {/* Recommended Specs Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-slate-300 block">Recommended Specifications:</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Dimensions:</strong> 1920 × 1080 px (16:9 widescreen) • <strong>Formats:</strong> WEBP, PNG, JPG, SVG • <strong>Max Upload:</strong> 2.5 MB
                  </p>
                </div>

                {/* Upload & Select Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/webp,image/png,image/jpeg,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 h-9 cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" /> Upload Image
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 h-9 cursor-pointer"
                  >
                    <FolderOpen className="h-4 w-4 text-slate-400" /> Choose from Media Library
                  </Button>

                  {pageContent.careersImage?.imageUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveImage}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold rounded-xl flex items-center gap-1.5 h-9 cursor-pointer ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove Image
                    </Button>
                  )}
                </div>

                {/* Alt Text Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Image Alt Text (SEO & Accessibility)</span>
                    <span className="text-[10px] text-slate-500">Screen reader text</span>
                  </label>
                  <Input
                    type="text"
                    value={pageContent.careersImage?.altText || ''}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        careersImage: {
                          ...prev.careersImage,
                          altText: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Astraiv Technologies engineering architects and full-stack developers collaborating on modern cloud architecture"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                {/* Show / Hide Toggle Switch */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Show Image on Public Website
                    </span>
                    <span className="text-[11px] text-slate-400">
                      When toggled OFF, the image and container are completely removed without blank space.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(pageContent.careersImage?.enabled)}
                      onChange={(e) => handleToggleShowImage(e.target.checked)}
                      disabled={isSaving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Heading & 4 Perks */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-5">
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
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-4">
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

          {/* Speculative Application Banner & Dedicated Copy */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              Speculative Application Banner (Careers Page Footer)
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

          {/* Speculative Application Page & Image Settings (Contact View) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Speculative Recruitment Page & Application Form Settings (/contact?type=speculative)
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                      pageContent.speculativeImage?.enabled && pageContent.speculativeImage?.imageUrl
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    )}
                  >
                    {pageContent.speculativeImage?.enabled && pageContent.speculativeImage?.imageUrl
                      ? 'Visible on Contact Page'
                      : 'Image Hidden'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Controls the left-column recruitment channels, action button, NDA notices, culture banner overlay, and right-column application form copy.
                </p>
              </div>
            </div>

            {/* Note about shared Headline & Subtitle */}
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 flex items-start gap-3 text-xs text-blue-200">
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Master Hero Headline & Subtitle Synchronization:</strong>
                <p className="text-[11px] text-blue-300 leading-relaxed mt-0.5">
                  The primary Left Column Headline and Subtitle are dynamically inherited from the <strong>Master Careers & Speculative Hero Section</strong> at the top of this tab. Updating the Headline or Subtitle above updates both <code>/careers</code> and <code>/contact?type=speculative</code> automatically.
                </p>
              </div>
            </div>

            {/* SECTION 1: Action Button & Left-Column SLA Notice */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <span>1. Left Column Action Button & NDA Notice</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Quick Action Button Text</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.buttonText || 'View All Active Job Openings'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          buttonText: e.target.value,
                        },
                      }))
                    }
                    placeholder="View All Active Job Openings"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Quick Action Button URL</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.buttonUrl || '/careers'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          buttonUrl: e.target.value,
                        },
                      }))
                    }
                    placeholder="/careers"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Left Column Candidate NDA SLA Notice</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.supportGuidance || 'Strict candidate privacy. Your submission is reviewed directly by our founding engineers under strict confidentiality.'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          supportGuidance: e.target.value,
                        },
                      }))
                    }
                    placeholder="Strict candidate privacy. Your submission is reviewed directly by our founding engineers under strict confidentiality."
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Direct Recruitment Communication Channels */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <span>2. Direct Recruitment Communication Channels (Left Column Cards)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Channel Label</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.contactEmailLabel || 'Recruitment'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          contactEmailLabel: e.target.value,
                        },
                      }))
                    }
                    placeholder="Recruitment"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address</label>
                  <Input
                    type="email"
                    value={pageContent.speculativePageCopy?.contactEmail || 'careers@astraivtechnologies.com'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          contactEmail: e.target.value,
                        },
                      }))
                    }
                    placeholder="careers@astraivtechnologies.com"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Phone Channel Label</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.contactPhoneLabel || 'Contact Us'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          contactPhoneLabel: e.target.value,
                        },
                      }))
                    }
                    placeholder="Contact Us"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Phone Number (International format supported)</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.contactPhone || '+91 8167409664'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          contactPhone: e.target.value,
                        },
                      }))
                    }
                    placeholder="+91 8167409664"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Location Channel Label</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.contactLocationLabel || 'Global Engineering Center'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          contactLocationLabel: e.target.value,
                        },
                      }))
                    }
                    placeholder="Global Engineering Center"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Location Description</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.contactLocation || 'Ashoknagar, Kolkata · 100% Remote Autonomy'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          contactLocation: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ashoknagar, Kolkata · 100% Remote Autonomy"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Right-Column Speculative Application Form Copy */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <span>3. Speculative Application Form Copy (Right Column)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Form Header Title</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.formHeading || 'Speculative Application'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          formHeading: e.target.value,
                        },
                      }))
                    }
                    placeholder="Speculative Application"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Form Header Badge Text</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.formBadge || 'Open Application · Fresher & Experienced'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          formBadge: e.target.value,
                        },
                      }))
                    }
                    placeholder="Open Application · Fresher & Experienced"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Form Pitch Prompt / Subheading</label>
                  <textarea
                    rows={2}
                    value={pageContent.speculativePageCopy?.formSubheading || 'Tell us about your technical depth, open-source projects, or architectural interests.'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          formSubheading: e.target.value,
                        },
                      }))
                    }
                    placeholder="Tell us about your technical depth, open-source projects, or architectural interests."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Candidate NDA Checkbox Label</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.ndaCheckboxLabel || 'By submitting, your profile is stored privately and reviewed strictly by our engineering founders under NDA.'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          ndaCheckboxLabel: e.target.value,
                        },
                      }))
                    }
                    placeholder="By submitting, your profile is stored privately and reviewed strictly by our engineering founders under NDA."
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Submit Button Text</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.submitButtonText || 'Submit Speculative Application'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          submitButtonText: e.target.value,
                        },
                      }))
                    }
                    placeholder="Submit Speculative Application"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Form Bottom SLA Note</label>
                  <Input
                    type="text"
                    value={pageContent.speculativePageCopy?.slaNote || 'Private recruitment engine • Direct founder review SLA 48h'}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        speculativePageCopy: {
                          ...(prev.speculativePageCopy || {}),
                          slaNote: e.target.value,
                        },
                      }))
                    }
                    placeholder="Private recruitment engine • Direct founder review SLA 48h"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Speculative Image Upload & Management Box */}
            <div className="pt-3 border-t border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <span>4. Speculative Team Banner Image & Badge Overlay</span>
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Image Preview */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 aspect-16/9 flex items-center justify-center group shadow-inner">
                    {pageContent.speculativeImage?.imageUrl ? (
                      <>
                        <Image
                          src={pageContent.speculativeImage.imageUrl}
                          alt={pageContent.speculativeImage.altText || 'Speculative Recruitment Banner'}
                          fill
                          className={cn(
                            'object-cover transition-opacity duration-300',
                            !pageContent.speculativeImage.enabled && 'opacity-40 grayscale'
                          )}
                          unoptimized
                        />
                        {!pageContent.speculativeImage.enabled && (
                          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                              <EyeOff className="h-3.5 w-3.5 text-amber-400" /> Image is Currently Hidden
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-500">
                        <ImageIcon className="h-10 w-10 text-slate-600 stroke-1" />
                        <p className="text-xs font-semibold">No Image Selected</p>
                        <p className="text-[11px] text-slate-600 max-w-xs">
                          Upload an engineering team image or choose an existing asset from the Media Library.
                        </p>
                      </div>
                    )}
                  </div>

                  {pageContent.speculativeImage?.imageUrl && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>
                          Dimensions:{' '}
                          <strong className="text-slate-200 font-mono">
                            {pageContent.speculativeImage.width || 1792} × {pageContent.speculativeImage.height || 1008} px
                          </strong>
                        </span>
                        <span>
                          Size:{' '}
                          <strong className="text-slate-200 font-mono">
                            {pageContent.speculativeImage.sizeLabel || '450 KB'}
                          </strong>
                        </span>
                      </div>
                      <span className="font-mono text-blue-400">Aspect 16:9</span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1 text-xs">
                    <span className="font-bold text-slate-300 block">Placement & Role:</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rendered directly between the <strong>&quot;View All Active Job Openings&quot;</strong> button and direct communication channels on the speculative application page.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={speculativeFileInputRef}
                      type="file"
                      accept="image/webp,image/png,image/jpeg,image/svg+xml"
                      onChange={handleSpeculativeFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => speculativeFileInputRef.current?.click()}
                      className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 h-9 cursor-pointer"
                    >
                      <UploadCloud className="h-4 w-4" /> Upload Image
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMediaPickerTarget('speculative_banner');
                        setIsMediaPickerOpen(true);
                      }}
                      className="border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 h-9 cursor-pointer"
                    >
                      <FolderOpen className="h-4 w-4 text-slate-400" /> Choose from Media Library
                    </Button>

                    {pageContent.speculativeImage?.imageUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveSpeculativeImage}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold rounded-xl flex items-center gap-1.5 h-9 cursor-pointer ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove Image
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Image Alt Text (SEO & Screen Readers)
                    </label>
                    <Input
                      type="text"
                      value={pageContent.speculativeImage?.altText || ''}
                      onChange={(e) =>
                        setPageContent((prev) => ({
                          ...prev,
                          speculativeImage: {
                            ...(prev.speculativeImage || { enabled: true, imageUrl: '', altText: '' }),
                            altText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Astraiv Technologies engineering architects and emerging engineers collaborating"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  {/* Image Badge Overlay Customization */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Image Badge Title (Left Pulse)
                      </label>
                      <Input
                        type="text"
                        value={pageContent.speculativeImage?.badgeText || 'Open Engineering Swarm'}
                        onChange={(e) =>
                          setPageContent((prev) => ({
                            ...prev,
                            speculativeImage: {
                              ...(prev.speculativeImage || { enabled: true, imageUrl: '', altText: '' }),
                              badgeText: e.target.value,
                            },
                          }))
                        }
                        placeholder="Open Engineering Swarm"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Image Badge Subtext (Right)
                      </label>
                      <Input
                        type="text"
                        value={pageContent.speculativeImage?.badgeSubtext || 'Fresher & Experienced'}
                        onChange={(e) =>
                          setPageContent((prev) => ({
                            ...prev,
                            speculativeImage: {
                              ...(prev.speculativeImage || { enabled: true, imageUrl: '', altText: '' }),
                              badgeSubtext: e.target.value,
                            },
                          }))
                        }
                        placeholder="Fresher & Experienced"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Show Image on Contact Page
                      </span>
                      <span className="text-[11px] text-slate-400">
                        When toggled OFF, the image is hidden seamlessly without blank space.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(pageContent.speculativeImage?.enabled !== false && pageContent.speculativeImage?.imageUrl)}
                        onChange={(e) => handleToggleShowSpeculativeImage(e.target.checked)}
                        disabled={isSaving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECTION: JOB DETAIL PAGE SHARED TEMPLATES & STANDARDS (/careers/[slug]) */}
          {/* ================================================================= */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Job Detail Shared Templates & Standards (/careers/[slug])
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Inherited by All Roles
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centralized copy, hiring roadmap, culture standards, and referral rewards shared by default across all job listing pages.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Mission & Role Impact Template */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. The Mission & Role Impact Section
                </h4>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Supports &#123;roleTitle&#125; variable
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Section Heading</label>
                  <Input
                    type="text"
                    value={sharedDefaults.missionHeading || 'The Mission & Role Impact'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, missionHeading: e.target.value })}
                    placeholder="The Mission & Role Impact"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Mission Template Body (Dynamic Placeholder)
                  </label>
                  <textarea
                    rows={3}
                    value={sharedDefaults.missionTemplate || ''}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, missionTemplate: e.target.value })}
                    placeholder="At Astraiv Technologies, we reject bloated corporate committees... As our {roleTitle}, you will possess end-to-end ownership..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-blue-500 resize-none leading-relaxed font-sans"
                  />
                </div>
                {/* Live Preview Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Live Rendering Preview for &quot;Senior Full-Stack Architect&quot;:
                  </span>
                  <p className="text-slate-300 text-[11.5px] leading-relaxed italic">
                    {(sharedDefaults.missionTemplate || 'At Astraiv Technologies, we reject bloated corporate committees and endless synchronous alignment meetings. As our {roleTitle}, you will possess end-to-end ownership of critical technical foundations, working asynchronously with senior peers to deploy battle-tested digital infrastructure.').replace(/\{roleTitle\}/g, 'Senior Full-Stack Architect')}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Common Engineering Benefits */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Standard Engineering Benefits & Culture (One per line)
                </h4>
                <span className="text-[11px] text-slate-400">
                  Applied to all roles unless custom benefits are specified
                </span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Section Heading</label>
                  <Input
                    type="text"
                    value={sharedDefaults.benefitsHeading || 'What We Offer & Engineering Culture'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, benefitsHeading: e.target.value })}
                    placeholder="What We Offer & Engineering Culture"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Common Benefits List</label>
                  <textarea
                    rows={5}
                    value={sharedDefaults.commonBenefits.join('\n')}
                    onChange={(e) =>
                      setSharedDefaults({
                        ...sharedDefaults,
                        commonBenefits: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    placeholder="100% remote work autonomy&#10;Top-of-market compensation&#10;$3,500 workstation stipend"
                    className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-sans resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 3. Transparent 4-Stage Interview Process */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  3. Transparent 4-Stage Interview Process Defaults
                </h4>
                <span className="text-[11px] text-slate-400">Roadmap for candidate expectations</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Roadmap Section Heading</label>
                  <Input
                    type="text"
                    value={sharedDefaults.interviewRoadmapHeading || 'Transparent 4-Stage Interview Process'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, interviewRoadmapHeading: e.target.value })}
                    placeholder="Transparent 4-Stage Interview Process"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Roadmap Subtitle</label>
                  <Input
                    type="text"
                    value={sharedDefaults.interviewRoadmapSubtitle || 'Fast, respectful, and zero algorithmic trick questions. We respect your engineering time.'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, interviewRoadmapSubtitle: e.target.value })}
                    placeholder="Fast, respectful, and zero algorithmic trick questions..."
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {sharedDefaults.interviewStages.map((stage, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-xs shrink-0">Stage {stage.num}</span>
                      <input
                        type="text"
                        value={stage.title}
                        onChange={(e) => {
                          const copy = [...sharedDefaults.interviewStages];
                          copy[idx].title = e.target.value;
                          setSharedDefaults({ ...sharedDefaults, interviewStages: copy });
                        }}
                        className="w-full px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-100"
                        placeholder="Stage Title"
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
                      className="w-full p-2.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 resize-none leading-relaxed"
                      placeholder="Stage Description"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. The Astraiv Standard (Sidebar) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                4. The Astraiv Standard (Job Sidebar Pillar)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Standard Card Heading</label>
                  <Input
                    type="text"
                    value={sharedDefaults.astraivStandardHeading || 'The Astraiv Standard'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, astraivStandardHeading: e.target.value })}
                    placeholder="The Astraiv Standard"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Standard Card Subtitle</label>
                  <Input
                    type="text"
                    value={sharedDefaults.astraivStandardSubtitle || 'Why Engineers Love Building Here'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, astraivStandardSubtitle: e.target.value })}
                    placeholder="Why Engineers Love Building Here"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Sidebar Bullet Points (One per line)</label>
                  <textarea
                    rows={3}
                    value={(sharedDefaults.astraivStandardPoints || []).join('\n')}
                    onChange={(e) =>
                      setSharedDefaults({
                        ...sharedDefaults,
                        astraivStandardPoints: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    placeholder="No pointless meetings...&#10;Work from anywhere in the world...&#10;Rapid sprint cadences..."
                    className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-sans resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 5. Employee Referral Program Banner */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  5. Employee Referral Program Banner
                </h4>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Supports &#123;referralBonus&#125; variable
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Banner Heading</label>
                  <Input
                    type="text"
                    value={sharedDefaults.referralHeading || 'Know an exceptional architect?'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, referralHeading: e.target.value })}
                    placeholder="Know an exceptional architect?"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Default Referral Reward Amount</label>
                  <Input
                    type="text"
                    value={sharedDefaults.defaultReferralBonus}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, defaultReferralBonus: e.target.value })}
                    placeholder="$3,000 USD (or local equivalent)"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Banner Body Template</label>
                  <Input
                    type="text"
                    value={sharedDefaults.referralBody || 'We offer a {referralBonus} referral bonus for successfully placed engineers and architects.'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, referralBody: e.target.value })}
                    placeholder="We offer a {referralBonus} referral bonus for successfully placed engineers and architects."
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 6. Application Form Security & SLA Defaults */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                6. Job Application Form Security & Privacy Defaults
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Form Header Subtitle (Zero recruiter filters pitch)</label>
                  <Input
                    type="text"
                    value={sharedDefaults.applicationSubheading || 'Reviewed directly by senior engineering architects within 48 business hours. Zero recruiter filters.'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, applicationSubheading: e.target.value })}
                    placeholder="Reviewed directly by senior engineering architects within 48 business hours. Zero recruiter filters."
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Candidate NDA / Privacy Agreement Text</label>
                  <Input
                    type="text"
                    value={sharedDefaults.defaultPrivacyText}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, defaultPrivacyText: e.target.value })}
                    placeholder="By submitting, your data is processed strictly under our NDA protocols and privacy policy. No unsolicited third-party disclosure."
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Bottom SLA & Encryption Security Badge</label>
                  <Input
                    type="text"
                    value={sharedDefaults.applicationSlaNote || 'Direct encryption & private storage isolation enabled • 48h SLA'}
                    onChange={(e) => setSharedDefaults({ ...sharedDefaults, applicationSlaNote: e.target.value })}
                    placeholder="Direct encryption & private storage isolation enabled • 48h SLA"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 7. Experienced Engineering & Swarm Culture Image Banner */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    7. Experienced Engineering & Swarm Culture Image Banner
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Shared static photo across all job postings to bridge whitespace between requirements and culture pillars.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Shared Asset
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Image Preview Container */}
                <div className="lg:col-span-6 space-y-2">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group shadow-inner">
                    {sharedDefaults.jobDetailImage?.imageUrl ? (
                      <>
                        <img
                          src={sharedDefaults.jobDetailImage.imageUrl}
                          alt={sharedDefaults.jobDetailImage.altText || 'Experienced Engineering Architecture Banner'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {sharedDefaults.jobDetailImage.enabled === false && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                              Hidden on Client Website
                            </span>
                          </div>
                        )}
                        {/* Live Overlay Badge Preview */}
                        {sharedDefaults.jobDetailImage.enabled !== false && (
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-200 shadow-xl">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-bold text-white tracking-tight">
                                {sharedDefaults.jobDetailImage.badgeText || 'Elite Senior Architecture Swarm'}
                              </span>
                              <span className="text-slate-400 hidden sm:inline">•</span>
                              <span className="text-slate-300 text-[10px] font-mono hidden sm:inline">
                                {sharedDefaults.jobDetailImage.badgeSubtext || 'High Autonomy & Systems Impact'}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-500">
                        <ImageIcon className="h-10 w-10 text-slate-600 stroke-1" />
                        <p className="text-xs font-semibold">No Image Selected</p>
                        <p className="text-[11px] text-slate-600 max-w-xs">
                          Upload an engineering banner or choose an existing asset from the Media Library.
                        </p>
                      </div>
                    )}
                  </div>

                  {sharedDefaults.jobDetailImage?.imageUrl && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>
                          Dimensions:{' '}
                          <strong className="text-slate-200 font-mono">
                            {sharedDefaults.jobDetailImage.width || 1792} × {sharedDefaults.jobDetailImage.height || 1008} px
                          </strong>
                        </span>
                        <span>
                          Size:{' '}
                          <strong className="text-slate-200 font-mono">
                            {sharedDefaults.jobDetailImage.sizeLabel || '420 KB'}
                          </strong>
                        </span>
                      </div>
                      <span className="font-mono text-cyan-400">Aspect 16:9</span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1 text-xs">
                    <span className="font-bold text-slate-300 block">Placement & Role:</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rendered in the <strong>right sidebar</strong> of all job listings to fill whitespace and showcase Astraiv experienced engineering culture.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={jobDetailFileInputRef}
                      type="file"
                      accept="image/webp,image/png,image/jpeg,image/svg+xml"
                      onChange={handleJobDetailFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => jobDetailFileInputRef.current?.click()}
                      className="bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 font-bold rounded-xl text-xs flex items-center gap-1.5 h-9 cursor-pointer"
                    >
                      <UploadCloud className="h-4 w-4" /> Upload Image
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMediaPickerTarget('job_detail_banner');
                        setIsMediaPickerOpen(true);
                      }}
                      className="border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 h-9 cursor-pointer"
                    >
                      <FolderOpen className="h-4 w-4 text-slate-400" /> Choose from Media Library
                    </Button>

                    {sharedDefaults.jobDetailImage?.imageUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveJobDetailImage}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold rounded-xl flex items-center gap-1.5 h-9 cursor-pointer ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove Image
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Image Alt Text (SEO & Screen Readers)
                    </label>
                    <Input
                      type="text"
                      value={sharedDefaults.jobDetailImage?.altText || ''}
                      onChange={(e) =>
                        setSharedDefaults((prev) => ({
                          ...prev,
                          jobDetailImage: {
                            ...(prev.jobDetailImage || { enabled: true, imageUrl: '', altText: '' }),
                            altText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Astraiv Technologies senior software architects collaborating on cloud-native systems architecture"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  {/* Card Title & Description Customization */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Image Card Title (Heading Below Image)
                      </label>
                      <Input
                        type="text"
                        value={sharedDefaults.jobDetailImage?.title || 'Experienced Architecture Swarm'}
                        onChange={(e) =>
                          setSharedDefaults((prev) => ({
                            ...prev,
                            jobDetailImage: {
                              ...(prev.jobDetailImage || { enabled: true, imageUrl: '', altText: '' }),
                              title: e.target.value,
                            },
                          }))
                        }
                        placeholder="Experienced Architecture Swarm"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Image Card Description (Subtitle Below Image)
                      </label>
                      <textarea
                        rows={2}
                        value={
                          sharedDefaults.jobDetailImage?.description ||
                          'Direct collaboration with principal architects on distributed, high-throughput cloud systems with zero corporate bureaucracy.'
                        }
                        onChange={(e) =>
                          setSharedDefaults((prev) => ({
                            ...prev,
                            jobDetailImage: {
                              ...(prev.jobDetailImage || { enabled: true, imageUrl: '', altText: '' }),
                              description: e.target.value,
                            },
                          }))
                        }
                        placeholder="Direct collaboration with principal architects on distributed, high-throughput cloud systems with zero corporate bureaucracy."
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs resize-none leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  {/* Image Badge Overlay Customization */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Image Badge Title (Left Pulse)
                      </label>
                      <Input
                        type="text"
                        value={sharedDefaults.jobDetailImage?.badgeText || 'Elite Senior Architecture Swarm'}
                        onChange={(e) =>
                          setSharedDefaults((prev) => ({
                            ...prev,
                            jobDetailImage: {
                              ...(prev.jobDetailImage || { enabled: true, imageUrl: '', altText: '' }),
                              badgeText: e.target.value,
                            },
                          }))
                        }
                        placeholder="Elite Senior Architecture Swarm"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Image Badge Subtext (Right)
                      </label>
                      <Input
                        type="text"
                        value={sharedDefaults.jobDetailImage?.badgeSubtext || 'High Autonomy & Systems Impact'}
                        onChange={(e) =>
                          setSharedDefaults((prev) => ({
                            ...prev,
                            jobDetailImage: {
                              ...(prev.jobDetailImage || { enabled: true, imageUrl: '', altText: '' }),
                              badgeSubtext: e.target.value,
                            },
                          }))
                        }
                        placeholder="High Autonomy & Systems Impact"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Show Image on Job Detail Pages
                      </span>
                      <span className="text-[11px] text-slate-400">
                        When toggled OFF, the banner is hidden across all job listings without blank space.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={Boolean(sharedDefaults.jobDetailImage?.enabled !== false && sharedDefaults.jobDetailImage?.imageUrl)}
                        onChange={(e) => handleToggleShowJobDetailImage(e.target.checked)}
                        disabled={isSaving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600" />
                    </label>
                  </div>
                </div>
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
                  <Check className="h-4 w-4 mr-2" /> Save & Publish All Page Content & Shared Standards
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
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500/30 dark:text-blue-200 text-xs flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-800 dark:text-blue-300">Canonical Role Categories Taxonomy</p>
              <p className="mt-0.5 leading-relaxed text-blue-700/80 dark:text-blue-200/80">
                Categories represent engineering disciplines (such as Engineering, AI & Automation, Cloud Ops) used for public filtering. A Job Title identifies a specific opening. Renaming a category updates filters and job cards across client and admin simultaneously.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {categories.length} Canonical Categories
            </span>
            <Button
              onClick={openCreateCategory}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Role Category
            </Button>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs dark:shadow-xl">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-4 px-4 w-20">Order</th>
                  <th className="py-4 px-4">Category Name</th>
                  <th className="py-4 px-4">Slug (URL Parameter)</th>
                  <th className="py-4 px-4">Open Positions</th>
                  <th className="py-4 px-4 w-28">Status</th>
                  <th className="py-4 px-4 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleReorderCategory(cat.id, 'up')}
                            disabled={idx === 0}
                            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderCategory(cat.id, 'down')}
                            disabled={idx === categories.length - 1}
                            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">#{cat.orderIndex}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cat.name}</span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">{cat.slug}</td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                        {cat.openingCount || 0} Positions
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10.5px] font-bold',
                          cat.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
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
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-500/20 dark:text-slate-300 dark:hover:text-red-400 cursor-pointer"
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
            <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingCategory ? 'Edit Role Category' : 'Add Role Category'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Name</label>
                    <Input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g. Distributed Systems"
                      className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={catActive}
                      onChange={(e) => setCatActive(e.target.checked)}
                      className="w-4 h-4 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Visible on Client Filter</span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsCatModalOpen(false)}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  placeholder="Search openings, stack..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
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
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
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
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
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
          <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-4 px-4 w-20">Order</th>
                    <th className="py-4 px-4">Opening Title & Category</th>
                    <th className="py-4 px-4">Location & Modality</th>
                    <th className="py-4 px-4">Experience</th>
                    <th className="py-4 px-4 w-28">Status</th>
                    <th className="py-4 px-4 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {filteredOpenings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        No job openings found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOpenings.map((job, idx) => (
                      <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => handleReorderJob(job.id, 'up')}
                                disabled={idx === 0}
                                className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderJob(job.id, 'down')}
                                disabled={idx === filteredOpenings.length - 1}
                                className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-slate-700 dark:text-slate-300">#{job.orderIndex}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{job.title}</span>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                {job.category?.name || job.department}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">/{job.slug}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {job.geographicLocation || 'Worldwide'} · {job.workMode || 'Remote'}
                            </span>
                            <span className="text-[11px] text-slate-500">{job.employmentType || 'Full-Time'}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
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
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white"
                              title="Preview on Client Site"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => openEditJobDrawer(job)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                              title="Edit Job Opening"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-500/20 dark:text-slate-300 dark:hover:text-red-400 cursor-pointer"
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
            <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0">
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  placeholder="Search candidate name, email, ref..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
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
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
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
                className="h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Types</option>
                <option value="job">Job Specific</option>
                <option value="speculative">Speculative</option>
              </select>
            </div>

            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              {filteredApplications.length} Candidates
            </span>
          </div>

          {/* Applications Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                        No applications found in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 font-mono">
                          <span className="font-bold text-slate-900 dark:text-slate-200 block">{app.applicationNumber}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900 dark:text-white text-sm block">{app.applicantName}</span>
                          <span className="text-slate-500 dark:text-slate-400">{app.email}</span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-bold text-blue-600 dark:text-blue-400 block">{app.jobTitle}</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {app.type === 'speculative' ? 'Speculative' : 'Opening'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="text-slate-700 dark:text-slate-300 block">{app.location}</span>
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
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/10 dark:border-blue-500/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/20 font-bold text-[11px] transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download Resume</span>
                            </a>
                          ) : app.resumeUrl ? (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-600/10 dark:border-purple-500/30 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-600/20 font-bold text-[11px] transition-colors"
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
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                                : app.status === 'interview'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30'
                                : app.status === 'offered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                                : app.status === 'reviewed'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
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
                            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 h-8 text-xs font-bold"
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
            <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedApp.applicantName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ref: {selectedApp.applicationNumber}</p>
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



      {/* Media Library Selector Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-600/10 dark:border dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center">
                  <FolderOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Choose Asset from Media Library</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Select an existing verified media asset for the careers hero image.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {mediaAssets.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <ImageIcon className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 stroke-1" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No assets found in Media Library</p>
                  <p className="text-[11px] text-slate-500">Please upload a new image directly from the main area.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectMediaAsset(asset)}
                      className={cn(
                        'group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-blue-500/60 hover:bg-blue-50/30 dark:hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between gap-2',
                        pageContent.careersImage?.imageUrl === asset.url && 'ring-2 ring-blue-500 border-blue-500'
                      )}
                    >
                      <div className="relative aspect-16/9 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
                        <Image
                          src={asset.url}
                          alt={asset.altText || asset.filename}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {asset.filename}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                          {asset.width && asset.height ? `${asset.width}×${asset.height}px` : 'Vector'} • {Math.round(asset.sizeBytes / 1024)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMediaPickerOpen(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
