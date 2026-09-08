'use client';

/**
 * @file admin/src/views/sections/footer-manager.tsx
 * @description [VIEW] Comprehensive interactive manager for client website footer, socials, and contact information.
 */

import { useState, useTransition } from 'react';
import {
  AdminFooterSettings,
  AdminFooterSettingsInput,
  AdminSocialLink,
  AdminSocialLinkInput,
} from '@/models/types';
import {
  updateFooterSettings,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  toggleSocialStatus,
  swapSocialOrder,
} from '@/controllers/footer.controller';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Save,
  Globe,
  Share2,
  Info,
  CheckCircle2,
  RefreshCw,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { Card, CardContent } from '@/views/ui/card';

// Pre-configured platform metadata with SVG icons, branding colors, and URL templates
export const PRESET_PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    placeholder: 'https://wa.me/918167409664',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-slate-950',
    color: '#25D366',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    placeholder: 'https://facebook.com/astraivtechnologies',
    bg: 'bg-blue-600/10 text-blue-400 border-blue-600/30 group-hover:bg-blue-600 group-hover:text-white',
    color: '#1877F2',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    placeholder: 'https://instagram.com/astraivtech',
    bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30 group-hover:bg-pink-500 group-hover:text-white',
    color: '#E4405F',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    placeholder: 'https://twitter.com/astraivtech',
    bg: 'bg-slate-800/60 text-slate-200 border-slate-700 group-hover:bg-white group-hover:text-black',
    color: '#000000',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/astraiv',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white',
    color: '#0A66C2',
  },
  {
    id: 'github',
    name: 'GitHub',
    placeholder: 'https://github.com/astraiv',
    bg: 'bg-slate-800/80 text-slate-300 border-slate-700 group-hover:bg-purple-600 group-hover:text-white',
    color: '#181717',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    placeholder: 'https://youtube.com/@astraiv',
    bg: 'bg-red-500/10 text-red-400 border-red-500/30 group-hover:bg-red-500 group-hover:text-white',
    color: '#FF0000',
  },
  {
    id: 'discord',
    name: 'Discord',
    placeholder: 'https://discord.gg/astraiv',
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white',
    color: '#5865F2',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    placeholder: 'https://t.me/astraiv',
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30 group-hover:bg-sky-500 group-hover:text-white',
    color: '#26A5E4',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    placeholder: 'https://reddit.com/r/astraiv',
    bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30 group-hover:bg-orange-500 group-hover:text-white',
    color: '#FF4500',
  },
  {
    id: 'threads',
    name: 'Threads',
    placeholder: 'https://threads.net/@astraivtech',
    bg: 'bg-slate-800 text-slate-200 border-slate-700 group-hover:bg-white group-hover:text-black',
    color: '#000000',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    placeholder: 'https://tiktok.com/@astraiv',
    bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30 group-hover:bg-teal-500 group-hover:text-white',
    color: '#000000',
  },
  {
    id: 'slack',
    name: 'Slack',
    placeholder: 'https://astraiv.slack.com',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950',
    color: '#4A154B',
  },
  {
    id: 'medium',
    name: 'Medium',
    placeholder: 'https://medium.com/@astraiv',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white',
    color: '#00AB6C',
  },
  {
    id: 'custom',
    name: 'Custom / Other',
    placeholder: 'https://example.com/profile',
    bg: 'bg-slate-800 text-slate-400 border-slate-700 group-hover:bg-blue-600 group-hover:text-white',
    color: '#3B82F6',
  },
];

// High-fidelity SVG renderers for each social platform
export function SocialIconRenderer({
  platform,
  className = 'h-4 w-4',
}: {
  platform: string;
  className?: string;
}) {
  const p = (platform || '').toLowerCase().trim();

  switch (p) {
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'twitter':
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" fill="currentColor" />
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18 6h0a14.5 14.5 0 0 0-4-1.5 9.8 9.8 0 0 0-.5 1.2 14.5 14.5 0 0 0-3 0 9.8 9.8 0 0 0-.5-1.2A14.5 14.5 0 0 0 6 6C3.5 10 3 14 3.5 18a14.8 14.8 0 0 0 4.5 2.2 11.2 11.2 0 0 0 1-1.6 9.6 9.6 0 0 1-1.6-.8l.4-.3c3.1 1.5 6.5 1.5 9.6 0l.4.3a9.6 9.6 0 0 1-1.6.8c.3.6.6 1.1 1 1.6A14.8 14.8 0 0 0 20.5 18c.6-4.5-.5-8.5-2.5-12z" />
          <circle cx="8.5" cy="12.5" r="1.5" fill="currentColor" />
          <circle cx="15.5" cy="12.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      );
    case 'reddit':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
          <path d="M8 15s1.5 2 4 2 4-2 4-2" />
        </svg>
      );
    case 'threads':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.5 12.5c-.8.8-1.9 1.2-3.5 1.2-2.3 0-3.8-1.5-3.8-3.7s1.5-3.7 3.8-3.7c1.4 0 2.5.4 3.2 1.2V7.5h1.8v8.3a4.5 4.5 0 0 1-4.8 4.7c-3.4 0-5.8-2.3-5.8-5.7s2.4-5.7 5.8-5.7c2.1 0 3.7.8 4.6 2.2l-1.4 1c-.6-.9-1.8-1.4-3.2-1.4-2.3 0-4 1.6-4 3.9s1.7 3.9 4 3.9a2.8 2.8 0 0 0 2.6-1.5l1.5 1z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      );
    case 'slack':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect width="3" height="8" x="13" y="2" rx="1.5" />
          <path d="M19 8.5V10h-1.5A1.5 1.5 0 1 1 19 8.5" />
          <rect width="8" height="3" x="8" y="13" rx="1.5" />
          <path d="M5 15.5V14h1.5A1.5 1.5 0 1 1 5 15.5" />
        </svg>
      );
    case 'medium':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <ellipse cx="6.5" cy="12" rx="4.5" ry="6" />
          <ellipse cx="15" cy="12" rx="2.5" ry="6" />
          <ellipse cx="20.5" cy="12" rx="1" ry="5.5" />
        </svg>
      );
    default:
      return <Globe className={className} />;
  }
}

interface FooterManagerProps {
  initialSettings: AdminFooterSettings;
  initialSocials: AdminSocialLink[];
}

export function FooterManager({ initialSettings, initialSocials }: FooterManagerProps) {
  const [activeTab, setActiveTab] = useState<'socials' | 'contact' | 'preview'>('socials');

  // Contact Info State
  const [contactSettings, setContactSettings] = useState<AdminFooterSettings>(initialSettings);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState<string | null>(null);
  const [contactErrorMsg, setContactErrorMsg] = useState<string | null>(null);

  // Social Links State
  const [socials, setSocials] = useState<AdminSocialLink[]>(initialSocials);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<AdminSocialLink | null>(null);
  const [deletingSocialId, setDeletingSocialId] = useState<string | null>(null);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [socialErrorMsg, setSocialErrorMsg] = useState<string | null>(null);
  const [socialSuccessToast, setSocialSuccessToast] = useState<string | null>(null);

  // Form states for Add/Edit Social Modal
  const [formPlatform, setFormPlatform] = useState('whatsapp');
  const [formName, setFormName] = useState('WhatsApp');
  const [formUrl, setFormUrl] = useState('https://wa.me/918167409664');
  const [formActive, setFormActive] = useState(true);

  const [, startTransition] = useTransition();

  // Helper to show temporary toast
  const triggerToast = (msg: string) => {
    setSocialSuccessToast(msg);
    setTimeout(() => {
      setSocialSuccessToast(null);
    }, 4000);
  };

  // Open modal for Adding new social
  const handleOpenAddModal = (presetId?: string) => {
    const selectedPreset = PRESET_PLATFORMS.find((p) => p.id === (presetId || 'whatsapp')) || PRESET_PLATFORMS[0];
    setFormPlatform(selectedPreset.id);
    setFormName(selectedPreset.name);
    setFormUrl(selectedPreset.placeholder);
    setFormActive(true);
    setEditingSocial(null);
    setSocialErrorMsg(null);
    setIsAddModalOpen(true);
  };

  // Open modal for Editing existing social
  const handleOpenEditModal = (social: AdminSocialLink) => {
    setEditingSocial(social);
    setFormPlatform(social.platform);
    setFormName(social.name);
    setFormUrl(social.url);
    setFormActive(social.active);
    setSocialErrorMsg(null);
    setIsAddModalOpen(true);
  };

  // Handle Preset Selection inside Modal
  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_PLATFORMS.find((p) => p.id === presetId);
    if (preset) {
      setFormPlatform(preset.id);
      if (!editingSocial) {
        setFormName(preset.name);
        setFormUrl(preset.placeholder);
      }
    }
  };

  // Save Social (Create or Update)
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      setSocialErrorMsg('Please provide a valid destination URL');
      return;
    }

    setIsSocialSubmitting(true);
    setSocialErrorMsg(null);

    try {
      if (editingSocial) {
        // Update
        const payload: Partial<AdminSocialLinkInput> = {
          platform: formPlatform,
          name: formName.trim() || formPlatform,
          url: formUrl.trim(),
          icon: formPlatform,
          active: formActive,
        };

        const res = await updateSocialLink(editingSocial.id, payload);
        if (!res.success) {
          setSocialErrorMsg(res.error || 'Failed to update social link');
          setIsSocialSubmitting(false);
          return;
        }

        setSocials((prev) =>
          prev.map((s) => (s.id === editingSocial.id ? { ...s, ...payload } as AdminSocialLink : s))
        );
        triggerToast(`Updated "${formName}" social link`);
      } else {
        // Create
        const maxOrder = socials.length > 0 ? Math.max(...socials.map((s) => s.order_index)) : 0;
        const payload: AdminSocialLinkInput = {
          platform: formPlatform,
          name: formName.trim() || formPlatform,
          url: formUrl.trim(),
          icon: formPlatform,
          active: formActive,
          order_index: maxOrder + 1,
        };

        const res = await createSocialLink(payload);
        if (!res.success || !res.data) {
          setSocialErrorMsg(res.error || 'Failed to create social link');
          setIsSocialSubmitting(false);
          return;
        }

        setSocials((prev) => [...prev, res.data!]);
        triggerToast(`Added "${formName}" to footer socials`);
      }

      setIsAddModalOpen(false);
    } catch (err: any) {
      setSocialErrorMsg(err?.message || 'An unexpected error occurred');
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  // Delete Social
  const handleDeleteSocial = async (id: string, name: string) => {
    try {
      const res = await deleteSocialLink(id);
      if (res.success) {
        setSocials((prev) => prev.filter((s) => s.id !== id));
        setDeletingSocialId(null);
        triggerToast(`Removed "${name}" from socials`);
      } else {
        alert(res.error || 'Failed to delete social link');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (social: AdminSocialLink) => {
    const nextState = !social.active;
    // Optimistic update
    setSocials((prev) =>
      prev.map((s) => (s.id === social.id ? { ...s, active: nextState } : s))
    );

    startTransition(async () => {
      const res = await toggleSocialStatus(social.id, nextState);
      if (res.success) {
        triggerToast(`"${social.name}" is now ${nextState ? 'visible' : 'hidden'} on client website`);
      } else {
        // Revert
        setSocials((prev) =>
          prev.map((s) => (s.id === social.id ? { ...s, active: !nextState } : s))
        );
        alert(res.error || 'Failed to toggle status');
      }
    });
  };

  // Order Swap (Up / Down)
  const handleSwapOrder = async (index1: number, index2: number) => {
    if (index1 < 0 || index2 < 0 || index1 >= socials.length || index2 >= socials.length) return;

    const item1 = socials[index1];
    const item2 = socials[index2];

    const updatedSocials = [...socials];
    updatedSocials[index1] = { ...item2, order_index: item1.order_index };
    updatedSocials[index2] = { ...item1, order_index: item2.order_index };

    setSocials(updatedSocials);

    startTransition(async () => {
      await swapSocialOrder(item1.id, item1.order_index, item2.id, item2.order_index);
    });
  };

  // Save Contact Settings
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    setContactSuccessMsg(null);
    setContactErrorMsg(null);

    try {
      const payload: AdminFooterSettingsInput = {
        brand_tagline: contactSettings.brand_tagline,
        phone: contactSettings.phone,
        email: contactSettings.email,
        address: contactSettings.address,
        map_url: contactSettings.map_url || undefined,
        copyright_text: contactSettings.copyright_text || undefined,
      };

      const res = await updateFooterSettings(payload);
      if (res.success && res.data) {
        setContactSettings(res.data);
        setContactSuccessMsg('Company footer contact information updated and synced live!');
        setTimeout(() => setContactSuccessMsg(null), 4000);
      } else {
        setContactErrorMsg(res.error || 'Failed to update contact settings');
      }
    } catch (err: any) {
      setContactErrorMsg(err?.message || 'Unexpected error occurred');
    } finally {
      setIsSavingContact(false);
    }
  };

  const activeSocialsCount = socials.filter((s) => s.active).length;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {socialSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{socialSuccessToast}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Socials
              </span>
              <span className="text-xl font-extrabold text-white">{socials.length} Configured</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active on Website
              </span>
              <span className="text-xl font-extrabold text-emerald-400">{activeSocialsCount} Visible</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Phone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Direct Line
              </span>
              <span className="text-xs font-bold text-slate-200 truncate block">
                {contactSettings.phone}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Support Email
              </span>
              <span className="text-xs font-bold text-slate-200 truncate block">
                {contactSettings.email}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('socials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'socials'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Share2 className="h-4 w-4" />
          <span>Social Networks ({socials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'contact'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Company Contact & Brand Info</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Live Footer Preview</span>
        </button>
      </div>

      {/* TAB 1: SOCIAL NETWORKS */}
      {activeTab === 'socials' && (
        <div className="space-y-6">
          {/* Action Header & Quick Presets */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blue-400" />
                Social Media Channels
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Attach social networks with their official logos. When clicked by clients, they redirect directly to that profile in a new tab.
              </p>
            </div>

            <Button
              onClick={() => handleOpenAddModal()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 shadow-lg shadow-blue-600/20 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Social Media
            </Button>
          </div>

          {/* Quick Platform Launchpad */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Add Popular Networks:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_PLATFORMS.filter((p) => p.id !== 'custom').map((preset) => {
                const isAlreadyAdded = socials.some((s) => s.platform.toLowerCase() === preset.id);
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleOpenAddModal(preset.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                      isAlreadyAdded
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-900/80 text-slate-200 border-slate-800 hover:border-blue-500/50 hover:bg-blue-600/10'
                    }`}
                  >
                    <SocialIconRenderer platform={preset.id} className="h-3.5 w-3.5" />
                    <span>{preset.name}</span>
                    {isAlreadyAdded && (
                      <span className="text-[10px] text-emerald-400 font-mono">✓ added</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Socials List Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">Order</th>
                    <th className="py-3.5 px-4">Social Network & Logo</th>
                    <th className="py-3.5 px-4">Redirect Destination URL</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {socials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Share2 className="h-8 w-8 mx-auto mb-2 opacity-40 text-blue-400" />
                        <p className="text-sm font-semibold text-slate-400">No social networks added yet.</p>
                        <p className="text-xs mt-1">Click &quot;Add Social Media&quot; above to connect your first channel.</p>
                      </td>
                    </tr>
                  ) : (
                    socials.map((social, idx) => {
                      return (
                        <tr
                          key={social.id}
                          className="hover:bg-slate-800/30 transition-colors group"
                        >
                          {/* Order swapping buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSwapOrder(idx, idx - 1)}
                                disabled={idx === 0}
                                className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-20 hover:bg-slate-800"
                                title="Move Up"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <span className="font-mono text-[11px] text-slate-400 font-bold w-4 text-center">
                                #{idx + 1}
                              </span>
                              <button
                                onClick={() => handleSwapOrder(idx, idx + 1)}
                                disabled={idx === socials.length - 1}
                                className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-20 hover:bg-slate-800"
                                title="Move Down"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Social Logo & Platform Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {/* Logo Box matching client website footer styling */}
                              <div className="h-9 w-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 shrink-0 shadow-inner group-hover:border-blue-500/40 group-hover:scale-105 transition-all">
                                <SocialIconRenderer platform={social.platform} className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-100 block text-xs">
                                  {social.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono capitalize">
                                  {social.platform}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Redirect Link with external test button */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 max-w-md">
                              <span className="truncate font-mono text-[11px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 select-all">
                                {social.url}
                              </span>
                              <a
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors shrink-0"
                                title="Test Redirect Link"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>

                          {/* Active / Hidden Status */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(social)}
                              className="cursor-pointer focus:outline-hidden"
                            >
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold capitalize transition-all ${
                                  social.active
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:bg-slate-800'
                                }`}
                              >
                                {social.active ? (
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden
                                  </span>
                                )}
                              </Badge>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditModal(social)}
                                className="h-8 px-2.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                title="Edit Social Link"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingSocialId(social.id)}
                                className="h-8 px-2.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                title="Remove Social Link"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY CONTACT & BRAND INFO */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSaveContact} className="space-y-6 max-w-4xl">
          {contactSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{contactSuccessMsg}</span>
            </div>
          )}

          {contactErrorMsg && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{contactErrorMsg}</span>
            </div>
          )}

          {/* Contact Details Card */}
          <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Direct Communication Details</h3>
                    <p className="text-xs text-slate-400">
                      Synchronized across the footer &quot;Call Us&quot;, &quot;Send Email&quot;, and &quot;Address&quot; sections.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-400" />
                    Contact Phone Number
                  </label>
                  <Input
                    type="text"
                    value={contactSettings.phone}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, phone: e.target.value })
                    }
                    placeholder="+91 8167409664"
                    required
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Used for the telephone tap-to-call link (<code className="font-mono">tel:{contactSettings.phone}</code>).
                  </span>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-400" />
                    Support & Inquiry Email
                  </label>
                  <Input
                    type="email"
                    value={contactSettings.email}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, email: e.target.value })
                    }
                    placeholder="info@astraivtechnologies.com"
                    required
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Used for email redirection (<code className="font-mono">mailto:{contactSettings.email}</code>).
                  </span>
                </div>

                {/* Physical Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    Office Address
                  </label>
                  <Input
                    type="text"
                    value={contactSettings.address}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, address: e.target.value })
                    }
                    placeholder="Ashoknagar, Kolkata"
                    required
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    Displayed prominently on client footer and contact pages.
                  </span>
                </div>

                {/* Google Maps Link */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                    Google Maps Link URL (Optional)
                  </label>
                  <Input
                    type="url"
                    value={contactSettings.map_url || ''}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, map_url: e.target.value })
                    }
                    placeholder="https://maps.google.com/?q=Ashoknagar,+Kolkata"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    URL opened when clients click on the Address card in the footer.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Tagline & Copyright Card */}
          <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Brand Tagline & Copyright</h3>
                    <p className="text-xs text-slate-400">
                      Footer branding description and legal copyright notice.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Footer Brand Tagline (Under Logo)
                  </label>
                  <textarea
                    rows={2}
                    value={contactSettings.brand_tagline}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, brand_tagline: e.target.value })
                    }
                    placeholder="Your trusted partner for AI, enterprise software, and scalable cloud systems."
                    required
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                {/* Copyright Text */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Copyright Notice
                  </label>
                  <Input
                    type="text"
                    value={contactSettings.copyright_text || ''}
                    onChange={(e) =>
                      setContactSettings({ ...contactSettings, copyright_text: e.target.value })
                    }
                    placeholder="Astraiv Technologies. All rights reserved."
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    The current year is automatically prepended (e.g. &copy; {new Date().getFullYear()} {contactSettings.copyright_text || 'Astraiv Technologies. All rights reserved.'}).
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSavingContact}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 px-6 shadow-lg shadow-blue-600/20"
            >
              {isSavingContact ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Contact & Footer Info
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: LIVE INTERACTIVE FOOTER PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span>
                Live preview rendering exactly as displayed on{' '}
                <span className="text-slate-200 font-bold font-mono">www.astraivtechnologies.com</span>
              </span>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
              Active & Live
            </Badge>
          </div>

          {/* Embedded Footer Mockup */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-slate-100 shadow-2xl overflow-hidden relative">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_1.5fr] gap-8 items-start text-left">
              {/* Brand Column */}
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/30">
                    A
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm tracking-wider text-white">ASTRAIV</span>
                    <span className="text-[9px] text-blue-400 font-bold tracking-widest uppercase">
                      TECHNOLOGIES
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  {contactSettings.brand_tagline}
                </p>

                {/* Social Network Icons with branded redirects */}
                <div className="flex items-center flex-wrap gap-2.5 mt-2">
                  {socials
                    .filter((s) => s.active)
                    .map((social) => (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-400 hover:text-blue-400 text-slate-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs"
                        aria-label={social.name}
                        title={`Redirects to ${social.name} (${social.url})`}
                      >
                        <SocialIconRenderer platform={social.platform} className="h-3.5 w-3.5" />
                      </a>
                    ))}
                </div>
              </div>

              {/* Column 1: Services */}
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 min-h-[20px] flex items-center">
                  Services
                </h4>
                <ul className="flex flex-col gap-3 text-xs text-slate-400">
                  <li className="hover:text-blue-400 cursor-pointer">AI Solutions & RAG</li>
                  <li className="hover:text-blue-400 cursor-pointer">SaaS Development</li>
                  <li className="hover:text-blue-400 cursor-pointer">Custom Systems</li>
                  <li className="hover:text-blue-400 cursor-pointer">Cloud & Infrastructure</li>
                </ul>
              </div>

              {/* Column 2: Platform */}
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 min-h-[20px] flex items-center">
                  Platform
                </h4>
                <ul className="flex flex-col gap-3 text-xs text-slate-400">
                  <li className="hover:text-blue-400 cursor-pointer">Why Astraiv</li>
                  <li className="hover:text-blue-400 cursor-pointer">Industries We Serve</li>
                  <li className="hover:text-blue-400 cursor-pointer">Our Technologies</li>
                  <li className="hover:text-blue-400 cursor-pointer">AI Capabilities</li>
                </ul>
              </div>

              {/* Column 3: Company */}
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 min-h-[20px] flex items-center">
                  Company
                </h4>
                <ul className="flex flex-col gap-3 text-xs text-slate-400">
                  <li className="hover:text-blue-400 cursor-pointer">Development Process</li>
                  <li className="hover:text-blue-400 cursor-pointer">Portfolio</li>
                  <li className="hover:text-blue-400 cursor-pointer">Flexible Pricing</li>
                  <li className="hover:text-blue-400 cursor-pointer">Frequently Asked Qs</li>
                </ul>
              </div>

              {/* Column 4: Contact Us */}
              <div className="flex flex-col text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 min-h-[20px] flex items-center">
                  Contact Us
                </h4>
                <div className="flex flex-col gap-3.5">
                  {/* Call */}
                  <a
                    href={`tel:${contactSettings.phone}`}
                    className="flex items-center gap-3 group text-left transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 group-hover:text-blue-400 transition-colors">
                        Call Us
                      </span>
                      <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-medium">
                        {contactSettings.phone}
                      </span>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:${contactSettings.email}`}
                    className="flex items-center gap-3 group text-left transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 group-hover:text-blue-400 transition-colors">
                        Send Email
                      </span>
                      <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-medium truncate max-w-[200px]">
                        {contactSettings.email}
                      </span>
                    </div>
                  </a>

                  {/* Address */}
                  <a
                    href={contactSettings.map_url || `https://maps.google.com/?q=${encodeURIComponent(contactSettings.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group text-left transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 group-hover:text-blue-400 transition-colors">
                        Address
                      </span>
                      <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-medium">
                        {contactSettings.address}
                      </span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar Mockup */}
            <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>
                &copy; {new Date().getFullYear()} {contactSettings.copyright_text || 'Astraiv Technologies. All rights reserved.'}
              </p>
              <div className="flex items-center gap-6">
                <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</span>
                <span className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SOCIAL NETWORK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <SocialIconRenderer platform={formPlatform} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSocial ? 'Edit Social Channel' : 'Add New Social Channel'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Attach network logo and target redirect URL.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {socialErrorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{socialErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSocial} className="space-y-4 text-xs">
              {/* Select Platform Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Select Social Platform
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {PRESET_PLATFORMS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                        formPlatform === preset.id
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-xs'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <SocialIconRenderer platform={preset.id} className="h-4 w-4 mb-1" />
                      <span className="text-[10px] truncate max-w-full">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Label / Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Platform Name / Label
                </label>
                <Input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. WhatsApp, Instagram"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs focus:border-blue-500"
                />
              </div>

              {/* Destination URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Destination Redirect Link (URL)
                </label>
                <Input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://instagram.com/astraivtech"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  Must be a valid URL with <code className="font-mono">https://</code> prefix.
                </span>
              </div>

              {/* Active Toggle & Live Preview Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 flex items-center justify-center">
                    <SocialIconRenderer platform={formPlatform} className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">{formName || 'Social Link'}</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] block">
                      {formUrl || 'https://...'}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-300">Active</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSocialSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2"
                >
                  {isSocialSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingSocial ? 'Update Social Link' : 'Add Social Link'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingSocialId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Remove Social Network</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove{' '}
              <strong className="text-white">
                {socials.find((s) => s.id === deletingSocialId)?.name}
              </strong>{' '}
              from the client website footer?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeletingSocialId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const target = socials.find((s) => s.id === deletingSocialId);
                  if (target) handleDeleteSocial(target.id, target.name);
                }}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
