'use client';

/**
 * @file admin/src/views/sections/footer-manager.tsx
 * @description [VIEW] Comprehensive manager for Footer Social Accounts and Company Contact Details.
 */

import { useState, useTransition } from 'react';
import {
  AdminFooterSettings,
  AdminFooterSettingsInput,
  AdminSocialLink,
} from '@/models/types';
import {
  updateFooterSettings,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  toggleSocialVisibility,
  reorderSocialLink,
} from '@/controllers/footer.controller';
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
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Share2,
  Building2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { AVAILABLE_PLATFORMS, SocialPlatformIcon } from '@/views/ui/icons';

interface FooterManagerProps {
  initialSettings: AdminFooterSettings;
  initialSocials: AdminSocialLink[];
}

export function FooterManager({ initialSettings, initialSocials }: FooterManagerProps) {
  const [activeTab, setActiveTab] = useState<'socials' | 'contact' | 'preview'>('socials');

  // --- SOCIALS STATE ---
  const [socials, setSocials] = useState<AdminSocialLink[]>(initialSocials);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<AdminSocialLink | null>(null);
  const [isSubmittingSocial, setIsSubmittingSocial] = useState(false);
  const [togglingSocialId, setTogglingSocialId] = useState<string | null>(null);

  // Social form fields
  const [socialPlatform, setSocialPlatform] = useState('linkedin');
  const [socialName, setSocialName] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [socialIcon, setSocialIcon] = useState('linkedin');
  const [socialActive, setSocialActive] = useState(true);

  // --- CONTACT / SETTINGS STATE ---
  const [settings, setSettings] = useState<AdminFooterSettings>(initialSettings);
  const [phone, setPhone] = useState(initialSettings.phone || '');
  const [email, setEmail] = useState(initialSettings.email || '');
  const [address, setAddress] = useState(initialSettings.address || '');
  const [mapUrl, setMapUrl] = useState(initialSettings.mapUrl || '');
  const [brandTagline, setBrandTagline] = useState(initialSettings.brandTagline || '');
  const [copyrightText, setCopyrightText] = useState(initialSettings.copyrightText || '');

  const [isPendingSettings, startTransition] = useTransition();
  const [settingsStatus, setSettingsStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setEditingSocial(null);
    setSocialPlatform('linkedin');
    setSocialName('LinkedIn');
    setSocialUrl('https://linkedin.com/company/astraiv-technologies');
    setSocialIcon('linkedin');
    setSocialActive(true);
    setIsSocialModalOpen(true);
  };

  const openEditModal = (item: AdminSocialLink) => {
    setEditingSocial(item);
    setSocialPlatform(item.platform);
    setSocialName(item.name);
    setSocialUrl(item.url);
    setSocialIcon(item.icon);
    setSocialActive(item.active);
    setIsSocialModalOpen(true);
  };

  const handlePlatformSelect = (p: string, label: string) => {
    setSocialPlatform(p);
    setSocialIcon(p);
    if (!editingSocial || socialName === '') {
      setSocialName(label);
    }
  };

  // --- SUBMIT SOCIAL ---
  const handleSubmitSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialName.trim() || !socialUrl.trim()) {
      alert('Please provide a name and valid URL for the social account.');
      return;
    }

    setIsSubmittingSocial(true);
    try {
      if (editingSocial) {
        const res = await updateSocialLink(editingSocial.id, {
          platform: socialPlatform,
          name: socialName,
          url: socialUrl,
          icon: socialIcon,
          active: socialActive,
        });

        if (res.success) {
          setSocials((prev) =>
            prev.map((s) =>
              s.id === editingSocial.id
                ? {
                    ...s,
                    platform: socialPlatform.toLowerCase().trim(),
                    name: socialName.trim(),
                    url: socialUrl.trim(),
                    icon: socialIcon.toLowerCase().trim(),
                    active: socialActive,
                  }
                : s
            )
          );
          setIsSocialModalOpen(false);
        } else {
          alert(res.error || 'Failed to update social account');
        }
      } else {
        const res = await createSocialLink({
          platform: socialPlatform,
          name: socialName,
          url: socialUrl,
          icon: socialIcon,
          active: socialActive,
        });

        if (res.success && res.data) {
          setSocials((prev) => [...prev, res.data as AdminSocialLink]);
          setIsSocialModalOpen(false);
        } else {
          alert(res.error || 'Failed to create social account');
        }
      }
    } finally {
      setIsSubmittingSocial(false);
    }
  };

  // --- DELETE SOCIAL ---
  const handleDeleteSocial = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from the footer?`)) return;

    try {
      const res = await deleteSocialLink(id);
      if (res.success) {
        setSocials((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(res.error || 'Failed to delete social account');
      }
    } catch {
      alert('Network error while deleting social account');
    }
  };

  // --- TOGGLE VISIBILITY (HIDE / UNHIDE) ---
  const handleToggleVisibility = async (id: string, currentActive: boolean) => {
    setTogglingSocialId(id);
    const newActive = !currentActive;

    // Optimistic update
    setSocials((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: newActive } : s))
    );

    try {
      const res = await toggleSocialVisibility(id, newActive);
      if (!res.success) {
        // Revert on failure
        setSocials((prev) =>
          prev.map((s) => (s.id === id ? { ...s, active: currentActive } : s))
        );
        alert(res.error || 'Failed to toggle visibility status.');
      }
    } catch {
      setSocials((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: currentActive } : s))
      );
      alert('Error updating visibility.');
    } finally {
      setTogglingSocialId(null);
    }
  };

  // --- REORDER SOCIAL ---
  const handleReorderSocial = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = socials.findIndex((s) => s.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= socials.length) return;

    // Optimistic swap
    const reordered = [...socials];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setSocials(reordered);

    try {
      const res = await reorderSocialLink(id, direction);
      if (!res.success) {
        setSocials(socials); // Revert
        alert(res.error || 'Failed to reorder accounts.');
      }
    } catch {
      setSocials(socials);
      alert('Error saving order.');
    }
  };

  // --- SAVE CONTACT SETTINGS ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatus({ type: null, message: '' });

    const payload: AdminFooterSettingsInput = {
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      mapUrl: mapUrl.trim(),
      brandTagline: brandTagline.trim(),
      copyrightText: copyrightText.trim(),
    };

    startTransition(async () => {
      const res = await updateFooterSettings(payload);
      if (res.success && res.data) {
        setSettings(res.data);
        setSettingsStatus({
          type: 'success',
          message: 'Footer contact info & location successfully updated and synced with client website!',
        });
      } else {
        setSettingsStatus({
          type: 'error',
          message: res.error || 'Failed to save footer settings.',
        });
      }
    });
  };

  const activeSocialsCount = socials.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Client Quick Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Footer Management Console</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Control the client footer in real time: social media channels, contact numbers, email, physical address, and maps location.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000#footer"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all duration-150 shadow-xs group"
          >
            <span>Preview Client Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
          </a>

          {activeTab === 'socials' && (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4"
            >
              <Plus className="h-4 w-4" /> Add Social Account
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('socials')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'socials'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          )}
        >
          <Share2 className="h-4 w-4" />
          <span>Social Media Accounts</span>
          <span
            className={cn(
              'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono',
              activeTab === 'socials'
                ? 'bg-blue-700 text-blue-100'
                : 'bg-slate-800 text-slate-400'
            )}
          >
            {activeSocialsCount}/{socials.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'contact'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          )}
        >
          <Building2 className="h-4 w-4" />
          <span>Contact Info & Location</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>Live Footer Preview</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SOCIAL MEDIA ACCOUNTS TABLE                          */}
      {/* ============================================================ */}
      {activeTab === 'socials' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Configured Social Channels</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accounts marked as <span className="text-emerald-400 font-semibold">Visible</span> are immediately rendered in the client footer. Use the eye icon to hide or unhide.
                </p>
              </div>
              <Button
                size="sm"
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs h-8 px-3"
              >
                <Plus className="h-3.5 w-3.5" /> Add Account
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4 w-16 text-center">Order</th>
                    <th className="py-3.5 px-4">Platform & Icon</th>
                    <th className="py-3.5 px-4">Display Label</th>
                    <th className="py-3.5 px-4 max-w-xs">Destination URL</th>
                    <th className="py-3.5 px-4 text-center w-28">Visibility</th>
                    <th className="py-3.5 px-4 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {socials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        No social accounts configured yet. Click &quot;+ Add Social Account&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    socials.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={cn(
                          'hover:bg-slate-800/40 transition-colors',
                          !item.active && 'opacity-65 bg-slate-950/40'
                        )}
                      >
                        {/* Order & Reorder Controls */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => handleReorderSocial(item.id, 'up')}
                                disabled={idx === 0}
                                className="text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                                title="Move Up"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderSocial(item.id, 'down')}
                                disabled={idx === socials.length - 1}
                                className="text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed p-0.5"
                                title="Move Down"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="font-mono text-xs text-slate-400 font-semibold ml-1">
                              #{idx + 1}
                            </span>
                          </div>
                        </td>

                        {/* Icon & Platform */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 shrink-0 shadow-xs">
                              <SocialPlatformIcon platform={item.platform || item.icon} className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white capitalize">{item.platform}</div>
                              <span className="text-[10px] text-slate-500 font-mono">icon: {item.icon}</span>
                            </div>
                          </div>
                        </td>

                        {/* Display Label */}
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {item.name}
                        </td>

                        {/* URL */}
                        <td className="py-3 px-4 max-w-xs">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 truncate max-w-[280px] font-mono text-[11px] hover:underline"
                            title={item.url}
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </td>

                        {/* Visibility (Hide/Unhide) Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(item.id, item.active)}
                            disabled={togglingSocialId === item.id}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border',
                              item.active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            )}
                            title={item.active ? 'Click to Hide from client' : 'Click to Unhide on client'}
                          >
                            {togglingSocialId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : item.active ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                            <span>{item.active ? 'Visible' : 'Hidden'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(item)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                              title="Edit account"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSocial(item.id, item.name)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                              title="Delete account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CONTACT INFORMATION & BRAND FORM                     */}
      {/* ============================================================ */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h4 className="text-sm font-bold text-white">Client Footer Contact Details</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update the official phone number, email address, physical location, and Google Maps pin.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Last updated: {new Date(settings.updatedAt).toLocaleTimeString()}
              </span>
            </div>

            {settingsStatus.type && (
              <div
                className={cn(
                  'p-4 rounded-xl mb-6 flex items-start gap-3 text-xs',
                  settingsStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                )}
              >
                {settingsStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span>{settingsStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone / Mobile */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-400" />
                    <span>Mobile / Phone Number</span>
                  </label>
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 8167409664"
                    required
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-10"
                  />
                  <p className="text-[10px] text-slate-500">Rendered in the &quot;Call Us&quot; footer card.</p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-400" />
                    <span>Email Address</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@astraivtechnologies.com"
                    required
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-10"
                  />
                  <p className="text-[10px] text-slate-500">Rendered in the &quot;Send Email&quot; footer card.</p>
                </div>
              </div>

              {/* Physical Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-400" />
                  <span>Physical Address / Office Location</span>
                </label>
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ashoknagar, Kolkata"
                  required
                  className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-10"
                />
                <p className="text-[10px] text-slate-500">Physical headquarters or city location shown in the footer.</p>
              </div>

              {/* Google Maps / Location URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
                  <span>Location Map Link (Google Maps URL)</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=Ashoknagar,+Kolkata"
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-10 font-mono"
                  />
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 transition-colors"
                      title="Test Map Link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">When users click the Address card, this URL opens in a new tab.</p>
              </div>

              {/* Brand Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Brand Tagline & Mission Statement
                </label>
                <textarea
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  rows={3}
                  placeholder="Your trusted partner for AI, enterprise software, and scalable cloud systems."
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-white text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
                <p className="text-[10px] text-slate-500">Brief summary displayed beneath the Astraiv logo in the footer.</p>
              </div>

              {/* Copyright Notice */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Copyright Notice
                </label>
                <Input
                  type="text"
                  value={copyrightText}
                  onChange={(e) => setCopyrightText(e.target.value)}
                  placeholder="Astraiv Technologies. All rights reserved."
                  className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-10"
                />
                <p className="text-[10px] text-slate-500">Rendered in the bottom bar with current year automatically appended.</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={isPendingSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 h-10 px-6 shadow-md shadow-blue-600/20 cursor-pointer text-xs"
                >
                  {isPendingSettings ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Contact Settings</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Side Live Card Preview */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                <span>Live Client Cards Preview</span>
              </h5>

              <div className="space-y-3.5">
                {/* Phone Preview */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Us</span>
                    <span className="text-xs text-white font-medium truncate">{phone || 'Not configured'}</span>
                  </div>
                </div>

                {/* Email Preview */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Send Email</span>
                    <span className="text-xs text-white font-medium truncate">{email || 'Not configured'}</span>
                  </div>
                </div>

                {/* Address Preview */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</span>
                    <span className="text-xs text-white font-medium truncate">{address || 'Not configured'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
                When you click &quot;Save Contact Settings&quot;, the database is updated and Next.js revalidates the cache instantly.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: FULL LIVE FOOTER PREVIEW                             */}
      {/* ============================================================ */}
      {activeTab === 'preview' && (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-900 mb-8">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">Client Footer Simulation</span>
            </div>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
            >
              <span>Open live website</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Footer Grid Simulation */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Brand + Socials */}
            <div className="space-y-4 md:col-span-2">
              <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span className="text-blue-500">ASTRAIV</span> TECHNOLOGIES
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                {brandTagline || settings.brandTagline}
              </p>

              <div className="flex items-center flex-wrap gap-2 pt-2">
                {socials
                  .filter((s) => s.active)
                  .map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-xs"
                      title={s.name}
                    >
                      <SocialPlatformIcon platform={s.platform || s.icon} className="h-3.5 w-3.5" />
                    </a>
                  ))}
              </div>
            </div>

            {/* Quick Contacts Simulation */}
            <div className="space-y-3.5 md:col-span-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">Contact Coordinates</h5>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-slate-300 text-xs">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block font-bold">Call Us</span>
                    <span className="text-white font-medium">{phone || settings.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300 text-xs">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block font-bold">Send Email</span>
                    <span className="text-white font-medium">{email || settings.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300 text-xs">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block font-bold">Address</span>
                    <span className="text-white font-medium">{address || settings.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>&copy; {new Date().getFullYear()} {copyrightText || settings.copyrightText}</span>
            <span>Live client sync enabled</span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT SOCIAL ACCOUNT                            */}
      {/* ============================================================ */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {editingSocial ? 'Edit Social Account' : 'Add New Social Account'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Configure account details and icon displayed in the client website footer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSocial} className="space-y-4">
              {/* Quick Platform Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Select Social Platform Preset
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {AVAILABLE_PLATFORMS.map((p) => {
                    const isSelected = socialPlatform.toLowerCase() === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handlePlatformSelect(p.value, p.label)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border',
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        )}
                      >
                        <SocialPlatformIcon platform={p.value} className="h-3 w-3" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Display Label / Tooltip
                </label>
                <Input
                  type="text"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  placeholder="e.g. LinkedIn, Twitter, Instagram"
                  required
                  className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-9"
                />
              </div>

              {/* Destination URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Destination Profile URL
                </label>
                <Input
                  type="url"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/astraiv-technologies"
                  required
                  className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-9 font-mono"
                />
              </div>

              {/* Icon & Live Preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Icon Identifier & Live Preview
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    value={socialIcon}
                    onChange={(e) => setSocialIcon(e.target.value)}
                    placeholder="e.g. linkedin, twitter, instagram"
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-white text-xs h-9"
                  />
                  <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0 shadow-xs">
                    <SocialPlatformIcon platform={socialIcon} className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Visible in Client Footer</span>
                  <span className="text-[11px] text-slate-400 block">
                    If disabled, this account remains saved in the database but is hidden from visitors.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSocialActive(!socialActive)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer',
                    socialActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  )}
                >
                  {socialActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{socialActive ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSocialModalOpen(false)}
                  className="text-slate-400 hover:text-white rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingSocial}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-4 flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {isSubmittingSocial ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingSocial ? 'Save Changes' : 'Add Account'}</span>
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
