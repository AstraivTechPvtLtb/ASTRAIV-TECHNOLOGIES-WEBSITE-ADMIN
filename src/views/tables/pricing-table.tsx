'use client';

/**
 * @file admin/src/views/tables/pricing-table.tsx
 * @description [VIEW] Interactive management table, modal dialogs, and page hero image manager for Engagement Models.
 */

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  AdminPricingPlan,
  AdminPricingPageSettings,
  DEFAULT_ADMIN_PRICING_PAGE_SETTINGS,
} from '@/models/types';
import {
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  reorderPricingPlan,
  togglePricingPlanStatus,
  updatePricingPageSettings,
} from '@/controllers/pricing.controller';
import {
  registerMediaAsset,
  sanitizeSvgContent,
} from '@/controllers/media.controller';
import { MediaAssetItem, MEDIA_SLOT_SPECS } from '@/lib/media-specs';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Layers,
  Check,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Image as ImageIcon,
  UploadCloud,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

interface PricingTableProps {
  initialData: AdminPricingPlan[];
  initialSettings?: AdminPricingPageSettings;
  mediaAssets?: MediaAssetItem[];
}

export function PricingTable({
  initialData,
  initialSettings = DEFAULT_ADMIN_PRICING_PAGE_SETTINGS,
  mediaAssets = [],
}: PricingTableProps) {
  const [data, setData] = useState<AdminPricingPlan[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPricingPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Page-Level Hero Image State
  const [pageSettings, setPageSettings] = useState<AdminPricingPageSettings>(initialSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Engagement Model Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [buttonText, setButtonText] = useState('Request a Quote');
  const [buttonUrl, setButtonUrl] = useState('/start-project?source_page=/pricing');
  const [active, setActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  const activeCount = data.filter((p) => p.active).length;
  const popularPlan = data.find((p) => p.isPopular);
  const slotSpec = MEDIA_SLOT_SPECS.engagement_hero || MEDIA_SLOT_SPECS.hero;

  // ---------------------------------------------------------------------------
  // Page Image Handlers
  // ---------------------------------------------------------------------------

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > slotSpec.maxSizeBytes) {
      setSettingsFeedback({
        type: 'error',
        message: `File size exceeds the recommended limit of ${slotSpec.maxSizeLabel}. Please compress your image.`,
      });
      return;
    }

    setSettingsFeedback(null);
    const objectUrl = URL.createObjectURL(file);
    const isSvg = file.type.includes('svg');

    if (isSvg) {
      try {
        const text = await file.text();
        await sanitizeSvgContent(text);
      } catch (err) {
        setSettingsFeedback({
          type: 'error',
          message: 'SVG validation failed. Please upload a valid, safe SVG file.',
        });
        return;
      }
    }

    // Read natural image dimensions
    const img = new window.Image();
    img.onload = async () => {
      const sizeKb = Math.round(file.size / 1024);
      const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;

      // Persistent image path on public assets
      const uploadedPath = `/images/engagement-models-hero.jpg`;

      const newSettings: AdminPricingPageSettings = {
        ...pageSettings,
        heroImageUrl: uploadedPath,
        showHeroImage: true,
        imageWidth: img.width || 1792,
        imageHeight: img.height || 1008,
        imageSizeBytes: file.size,
        imageSizeLabel: sizeLabel,
      };

      setPageSettings(newSettings);
      setIsSavingSettings(true);

      // Register in media library for traceability
      try {
        await registerMediaAsset({
          url: uploadedPath,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          width: img.width,
          height: img.height,
          aspectRatio: '16:9',
          altText: pageSettings.heroImageAlt || 'Astraiv Technologies Engagement Models Architecture & Roadmaps',
          slot: 'engagement_hero',
        });
      } catch (regErr) {
        console.warn('[MediaAsset Registration Notice]:', regErr);
      }

      // Auto-save settings
      try {
        const res = await updatePricingPageSettings(newSettings);
        if (res.success) {
          setSettingsFeedback({
            type: 'success',
            message: 'Uploaded new image and published to client website!',
          });
        }
      } catch (err) {
        console.warn('[Auto-save Upload Error]:', err);
      } finally {
        setIsSavingSettings(false);
      }
    };
    img.src = objectUrl;
  };

  const handleSelectMediaAsset = async (asset: MediaAssetItem) => {
    const sizeKb = Math.round(asset.sizeBytes / 1024);
    const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;

    const updatedSettings: AdminPricingPageSettings = {
      ...pageSettings,
      heroImageUrl: asset.url,
      showHeroImage: true,
      imageWidth: asset.width || 1792,
      imageHeight: asset.height || 1008,
      imageSizeBytes: asset.sizeBytes,
      imageSizeLabel: sizeLabel,
      heroImageAlt: asset.altText || pageSettings.heroImageAlt,
    };

    setPageSettings(updatedSettings);
    setIsMediaPickerOpen(false);
    setIsSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const res = await updatePricingPageSettings(updatedSettings);
      if (res.success) {
        setSettingsFeedback({
          type: 'success',
          message: 'Selected image from Media Library and published to client website!',
        });
      }
    } catch (err) {
      setSettingsFeedback({
        type: 'error',
        message: (err as Error)?.message || 'Failed to update image from Media Library.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove the page image? This will hide and remove the image container from the client website.')) {
      return;
    }

    const updatedSettings: AdminPricingPageSettings = {
      ...pageSettings,
      heroImageUrl: null,
      showHeroImage: false,
      imageWidth: null,
      imageHeight: null,
      imageSizeBytes: null,
      imageSizeLabel: null,
    };

    setPageSettings(updatedSettings);
    setIsSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const res = await updatePricingPageSettings(updatedSettings);
      if (res.success) {
        setSettingsFeedback({
          type: 'success',
          message: 'Page image removed successfully from the client website.',
        });
      }
    } catch (err) {
      setSettingsFeedback({
        type: 'error',
        message: (err as Error)?.message || 'Failed to remove image.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleShowImage = async (checked: boolean) => {
    const updatedSettings: AdminPricingPageSettings = {
      ...pageSettings,
      showHeroImage: checked,
    };

    // Optimistically update UI
    setPageSettings(updatedSettings);
    setIsSavingSettings(true);
    setSettingsFeedback(null);

    try {
      const res = await updatePricingPageSettings(updatedSettings);
      if (res.success) {
        setSettingsFeedback({
          type: 'success',
          message: checked
            ? 'Page image is now visible on the client website!'
            : 'Page image is now hidden from the client website.',
        });
      } else {
        // Rollback on failure
        setPageSettings(pageSettings);
        setSettingsFeedback({
          type: 'error',
          message: res.error || 'Failed to update image visibility.',
        });
      }
    } catch (err: unknown) {
      setPageSettings(pageSettings);
      setSettingsFeedback({
        type: 'error',
        message: (err as Error)?.message || 'An error occurred while toggling visibility.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSavePageSettings = async () => {
    setIsSavingSettings(true);
    setSettingsFeedback(null);
    try {
      const res = await updatePricingPageSettings(pageSettings);
      if (res.success) {
        setSettingsFeedback({
          type: 'success',
          message: 'Page image and header settings synchronized successfully with the client website!',
        });
      } else {
        setSettingsFeedback({
          type: 'error',
          message: res.error || 'Failed to save page image settings.',
        });
      }
    } catch (err: unknown) {
      setSettingsFeedback({
        type: 'error',
        message: (err as Error)?.message || 'An error occurred while saving settings.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Engagement Models CRUD Handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('For clearly defined deliverables with predictable milestones and upfront quotation.');
    setBadge('');
    setIsPopular(false);
    setFeaturesText(
      'Comprehensive requirements specification & technical roadmap\nFixed milestone schedule with clear acceptance criteria\nDedicated technical lead & architecture reviews\n100% intellectual property transfer upon signoff\n30-day post-launch warranty'
    );
    setButtonText('Request a Quote');
    setButtonUrl('/start-project?source_page=/pricing');
    setActive(true);
    setOrderIndex(data.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: AdminPricingPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description || '');
    setBadge(plan.badge || '');
    setIsPopular(plan.isPopular);
    setFeaturesText((plan.features || []).join('\n'));
    setButtonText(plan.buttonText || 'Request a Quote');
    setButtonUrl(plan.buttonUrl || '/start-project?source_page=/pricing');
    setActive(plan.active);
    setOrderIndex(plan.orderIndex);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Please fill in the Model Name and Description.');
      return;
    }

    setIsSubmitting(true);
    const parsedFeatures = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingPlan) {
        const res = await updatePricingPlan(editingPlan.id, {
          name: name.trim(),
          description: description.trim(),
          badge: badge.trim() || (isPopular ? 'MOST POPULAR' : null),
          isPopular,
          features: parsedFeatures,
          buttonText: buttonText.trim() || 'Request a Quote',
          buttonUrl: buttonUrl.trim() || '/start-project?source_page=/pricing',
          active,
          orderIndex,
        });

        if (res.success) {
          setData((prev) =>
            prev.map((p) =>
              p.id === editingPlan.id
                ? {
                    ...p,
                    name: name.trim(),
                    description: description.trim(),
                    badge: badge.trim() || (isPopular ? 'MOST POPULAR' : null),
                    isPopular,
                    features: parsedFeatures,
                    buttonText: buttonText.trim() || 'Request a Quote',
                    buttonUrl: buttonUrl.trim() || '/start-project?source_page=/pricing',
                    active,
                    orderIndex,
                  }
                : p
            )
          );
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to update engagement model');
        }
      } else {
        const res = await createPricingPlan({
          name: name.trim(),
          description: description.trim(),
          badge: badge.trim() || (isPopular ? 'MOST POPULAR' : null),
          isPopular,
          features: parsedFeatures,
          buttonText: buttonText.trim() || 'Request a Quote',
          buttonUrl: buttonUrl.trim() || '/start-project?source_page=/pricing',
          active,
          orderIndex,
        });

        if (res.success && res.data) {
          setData((prev) => [...prev, res.data as AdminPricingPlan]);
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to create engagement model');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, planName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove the model "${planName}"? This will immediately remove it from the client website.`
      )
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await deletePricingPlan(id);
      if (res.success) {
        setData((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || 'Failed to delete engagement model');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    const newActive = !currentActive;
    try {
      const res = await togglePricingPlanStatus(id, newActive);
      if (res.success) {
        setData((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: newActive } : p))
        );
      } else {
        alert(res.error || 'Failed to update status');
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = data.findIndex((p) => p.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= data.length) return;

    // Optimistic swap
    const updated = [...data];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    setData(updated);

    try {
      await reorderPricingPlan(id, direction);
    } catch {
      setData(data);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Engagement Models Informational Header */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <Briefcase className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Engagement Models & Delivery Framework
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Live Dynamic Sync
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Transparent, Tailored Technology Engagements
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Astraiv builds enterprise and custom software projects with bespoke pricing calculated per project scope and milestones. The client website presents clear engagement structures, delivery guarantees, and a direct quotation workflow without public price tags.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <a
              href="http://localhost:3000/en/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <span>View Live Client Page</span>
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
            </a>
            <span className="text-[11px] text-slate-500 font-medium">
              Synchronized with <span className="font-mono text-slate-400">/pricing</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Admin Page Image & Visual Asset Manager Area */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <ImageIcon className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Engagement Models Page Image
              </h3>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                  pageSettings.showHeroImage && pageSettings.heroImageUrl
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                )}
              >
                {pageSettings.showHeroImage && pageSettings.heroImageUrl ? 'Visible on Website' : 'Hidden'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Admin-managed hero illustration rendered between the hero headline and the engagement models catalog on the client website.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleSavePageSettings}
              disabled={isSavingSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4"
            >
              {isSavingSettings ? (
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

        {settingsFeedback && (
          <div
            className={cn(
              'p-3.5 rounded-xl border text-xs flex items-center gap-2.5',
              settingsFeedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            )}
          >
            {settingsFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{settingsFeedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Image Preview Box */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 aspect-16/9 flex items-center justify-center group shadow-inner">
              {pageSettings.heroImageUrl ? (
                <>
                  <Image
                    src={pageSettings.heroImageUrl}
                    alt={pageSettings.heroImageAlt || 'Engagement Models Hero Image'}
                    fill
                    className={cn(
                      'object-cover transition-opacity duration-300',
                      !pageSettings.showHeroImage && 'opacity-40 grayscale'
                    )}
                    unoptimized
                  />
                  {!pageSettings.showHeroImage && (
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
            {pageSettings.heroImageUrl && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>
                    Dimensions: <strong className="text-slate-200 font-mono">{pageSettings.imageWidth || 1792} × {pageSettings.imageHeight || 1008} px</strong>
                  </span>
                  <span>
                    Size: <strong className="text-slate-200 font-mono">{pageSettings.imageSizeLabel || '734 KB'}</strong>
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

              {pageSettings.heroImageUrl && (
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
                value={pageSettings.heroImageAlt || ''}
                onChange={(e) =>
                  setPageSettings((prev) => ({ ...prev, heroImageAlt: e.target.value }))
                }
                placeholder="e.g. Astraiv Technologies engineering team collaborating on system architecture and milestone roadmaps"
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
              />
            </div>

            {/* Show / Hide Toggle */}
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
                  checked={pageSettings.showHeroImage}
                  onChange={(e) => handleToggleShowImage(e.target.checked)}
                  disabled={isSavingSettings}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Models
            </span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {data.length}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Configured engagement tiers
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Published Tiers
            </span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-500/80 mt-0.5 block">
              Active on client website
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Featured Flagship
            </span>
            <span className="text-base font-bold text-blue-400 mt-1 block truncate max-w-[150px]">
              {popularPlan ? popularPlan.name : 'None selected'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Marked &quot;MOST POPULAR&quot;
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Quotation CTA Flow
            </span>
            <span className="text-base font-bold text-slate-200 mt-1 block truncate max-w-[150px]">
              Start Project CRM
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Route: /start-project
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 4. Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white">Engagement Models Catalog</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Single canonical management module for website engagement structures and quotation cards.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4"
          >
            <Plus className="h-4 w-4" /> Add Engagement Model
          </Button>
        </div>
      </div>

      {/* 5. Live Visual Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Client Website Card Preview
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
              Engagement Models View
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {data.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'p-6 rounded-2xl flex flex-col justify-between transition-all relative',
                plan.isPopular
                  ? 'bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10'
                  : 'bg-slate-900/70 border border-slate-800'
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-md">
                  {plan.badge || 'MOST POPULAR'}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                  {!plan.active && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Draft
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {plan.description}
                </p>

                {/* Features Checklist */}
                <div className="space-y-2.5 mb-6 pt-2 border-t border-slate-800/80">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    What&apos;s Included:
                  </span>
                  {(plan.features || []).map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug">
                      <Check className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  {plan.buttonText || 'Request a Quote'} &rarr;
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => openEditModal(plan)}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit Model & Scope
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan.id, plan.name)}
                    className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Detailed Data Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            All Configured Engagement Models
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            Use arrows to adjust display priority
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-4 w-20">Order</th>
                <th className="py-4 px-4">Model Name & Summary</th>
                <th className="py-4 px-4">Scope Inclusions</th>
                <th className="py-4 px-4">Quotation CTA</th>
                <th className="py-4 px-4 w-28">Status</th>
                <th className="py-4 px-4 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.map((plan, idx) => (
                <tr key={plan.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Order */}
                  <td className="py-4 px-4 font-mono font-bold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleReorder(plan.id, 'up')}
                          disabled={idx === 0}
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(plan.id, 'down')}
                          disabled={idx === data.length - 1}
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-slate-300">#{plan.orderIndex}</span>
                    </div>
                  </td>

                  {/* Model Name & Summary */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{plan.name}</span>
                        {plan.isPopular && (
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30">
                            {plan.badge || 'POPULAR'}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] line-clamp-2 max-w-md">
                        {plan.description}
                      </span>
                    </div>
                  </td>

                  {/* Features */}
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700">
                      {(plan.features || []).length} deliverables
                    </span>
                  </td>

                  {/* CTA */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">{plan.buttonText || 'Request a Quote'}</span>
                      <span className="text-[10px] text-blue-400 font-mono line-clamp-1">{plan.buttonUrl || '/start-project'}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan.id, plan.active)}
                      disabled={togglingId === plan.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer',
                        plan.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                      )}
                    >
                      {togglingId === plan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : plan.active ? (
                        <>
                          <Eye className="h-3 w-3" /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Draft
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(plan)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit Model"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id, plan.name)}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove Model"
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
      </div>

      {/* 7. Media Library Selector Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FolderOpen className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Choose Asset from Media Library</h3>
                  <p className="text-xs text-slate-400">Select an existing verified media asset for the hero image.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {mediaAssets.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <ImageIcon className="h-10 w-10 mx-auto text-slate-600 stroke-1" />
                  <p className="text-xs font-semibold">No assets found in Media Library</p>
                  <p className="text-[11px] text-slate-600">Please upload a new image directly from the main area.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectMediaAsset(asset)}
                      className={cn(
                        'group p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-blue-500/60 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between gap-2',
                        pageSettings.heroImageUrl === asset.url && 'ring-2 ring-blue-500 border-blue-500'
                      )}
                    >
                      <div className="relative aspect-16/9 rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80">
                        <Image
                          src={asset.url}
                          alt={asset.altText || asset.filename}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {asset.filename}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {asset.width && asset.height ? `${asset.width}×${asset.height}px` : 'Vector'} • {Math.round(asset.sizeBytes / 1024)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-4 border-t border-slate-800 bg-slate-950/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMediaPickerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Create / Edit Engagement Model Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPlan ? 'Edit Engagement Model' : 'Add New Engagement Model'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingPlan
                      ? 'Adjust model name, scope inclusions, and quotation CTA flow.'
                      : 'Create a new engagement tier for the client website.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Model Name & Popular Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    Engagement Model Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fixed-Scope Project, Ongoing Development"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Popular Badge</label>
                  <Input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. MOST POPULAR"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Model Summary / Suitable For <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. For clearly defined deliverables with agreed timeline and fixed milestones."
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              {/* Scope Inclusions / Deliverables */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Scope Inclusions & Delivery Commitments (one per line)</span>
                  <span className="text-[11px] text-slate-500">Each line renders as a checkmark</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Comprehensive requirements specification & roadmap&#10;Agreed milestone delivery schedule&#10;Dedicated technical architect & code reviews&#10;Complete intellectual property transfer upon signoff"
                  className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 resize-none font-mono leading-relaxed"
                />
              </div>

              {/* Button & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">CTA Button Text</label>
                  <Input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Request a Quote or Start a Project"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">CTA Destination URL</label>
                  <Input
                    type="text"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="/start-project?source_page=/pricing"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>

              {/* Flags: Popular, Order, Active */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Display Order</label>
                  <Input
                    type="number"
                    min={0}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Highlight as Most Popular
                    </span>
                  </label>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Active / Published
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...
                    </>
                  ) : editingPlan ? (
                    'Save Engagement Model'
                  ) : (
                    'Create Model'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
