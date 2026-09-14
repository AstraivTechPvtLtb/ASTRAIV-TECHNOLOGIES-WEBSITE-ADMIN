'use client';

/**
 * @file admin/src/views/settings/iso-compliance-manager.tsx
 * @description [VIEW] Interactive settings manager for Client Website ISO Certification seal & Metrics section.
 */

import { useState } from 'react';
import { AdminComplianceSettings } from '@/models/types';
import { updateComplianceSettings } from '@/controllers/compliance.controller';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Badge } from '@/views/ui/badge';
import { Card, CardContent } from '@/views/ui/card';
import { cn } from '@/lib/utils';

interface IsoComplianceManagerProps {
  initialSettings: AdminComplianceSettings;
}

export function IsoComplianceManager({ initialSettings }: IsoComplianceManagerProps) {
  const [isoNumber, setIsoNumber] = useState(initialSettings.isoNumber || 'ISO 27001:2022');
  const [isoLabel, setIsoLabel] = useState(initialSettings.isoLabel || 'Certified');
  const [showIsoBadge, setShowIsoBadge] = useState<boolean>(initialSettings.showIsoBadge ?? true);
  const [showIsoSection, setShowIsoSection] = useState<boolean>(initialSettings.showIsoSection ?? true);

  // Performance Metrics
  const [uptimeValue, setUptimeValue] = useState(initialSettings.uptimeValue || '99.99%');
  const [uptimeLabel, setUptimeLabel] = useState(initialSettings.uptimeLabel || 'SERVER UPTIME');
  const [savingsValue, setSavingsValue] = useState(initialSettings.savingsValue || '40%+');
  const [savingsLabel, setSavingsLabel] = useState(initialSettings.savingsLabel || 'INFRASTRUCTURE SAVING');
  const [actionsValue, setActionsValue] = useState(initialSettings.actionsValue || '10M+');
  const [actionsLabel, setActionsLabel] = useState(initialSettings.actionsLabel || 'API ACTIONS');
  const [slaValue, setSlaValue] = useState(initialSettings.slaValue || '100%');
  const [slaLabel, setSlaLabel] = useState(initialSettings.slaLabel || 'ON-TIME SLA DELIVERY');

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);

    try {
      const res = await updateComplianceSettings({
        isoNumber,
        isoLabel,
        showIsoBadge,
        showIsoSection,
        uptimeValue,
        uptimeLabel,
        savingsValue,
        savingsLabel,
        actionsValue,
        actionsLabel,
        slaValue,
        slaLabel,
      });

      if (res.success) {
        setNotice({
          type: 'success',
          message: 'Changes saved! The ISO certification settings are now updated on the client website.',
        });
        setTimeout(() => setNotice(null), 5000);
      } else {
        setNotice({
          type: 'error',
          message: res.error || 'Failed to update compliance settings.',
        });
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'An unexpected error occurred while saving.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleIsoBadge = async () => {
    const nextVal = !showIsoBadge;
    setShowIsoBadge(nextVal);
    setIsSaving(true);
    setNotice(null);

    try {
      const res = await updateComplianceSettings({
        isoNumber,
        isoLabel,
        showIsoBadge: nextVal,
        showIsoSection,
        uptimeValue,
        uptimeLabel,
        savingsValue,
        savingsLabel,
        actionsValue,
        actionsLabel,
        slaValue,
        slaLabel,
      });

      if (res.success) {
        setNotice({
          type: 'success',
          message: nextVal
            ? 'ISO Number Badge is now visible on the client website!'
            : 'ISO Number Badge is now hidden from the client website!',
        });
        setTimeout(() => setNotice(null), 4000);
      } else {
        setNotice({
          type: 'error',
          message: res.error || 'Failed to update compliance settings.',
        });
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'An error occurred while saving.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleIsoSection = async () => {
    const nextVal = !showIsoSection;
    setShowIsoSection(nextVal);
    setIsSaving(true);
    setNotice(null);

    try {
      const res = await updateComplianceSettings({
        isoNumber,
        isoLabel,
        showIsoBadge,
        showIsoSection: nextVal,
        uptimeValue,
        uptimeLabel,
        savingsValue,
        savingsLabel,
        actionsValue,
        actionsLabel,
        slaValue,
        slaLabel,
      });

      if (res.success) {
        setNotice({
          type: 'success',
          message: nextVal
            ? 'Performance metrics section is now active on the client website!'
            : 'Performance metrics section is now completely hidden from the client website!',
        });
        setTimeout(() => setNotice(null), 4000);
      } else {
        setNotice({
          type: 'error',
          message: res.error || 'Failed to update compliance settings.',
        });
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'An error occurred while saving.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setIsoNumber('ISO 27001:2022');
    setIsoLabel('Certified');
    setShowIsoBadge(true);
    setShowIsoSection(true);
    setUptimeValue('99.99%');
    setUptimeLabel('SERVER UPTIME');
    setSavingsValue('40%+');
    setSavingsLabel('INFRASTRUCTURE SAVING');
    setActionsValue('10M+');
    setActionsLabel('API ACTIONS');
    setSlaValue('100%');
    setSlaLabel('ON-TIME SLA DELIVERY');
  };

  return (
    <Card id="iso-compliance-section" className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Header with Title and Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Client Website — ISO & Compliance Section
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your ISO certification seal, customize the ISO number and label, or hide the section from the client website.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:3000/en#stats"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all shrink-0"
            >
              <span>View Client Section</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Live Client Website Visual Preview */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Live Visual Preview (As Seen on Client Website)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Section Status: {showIsoSection ? (showIsoBadge ? 'Seal Active' : 'Metrics Only') : 'Hidden'}
            </span>
          </div>

          <div className={cn(
            'p-6 sm:p-8 rounded-2xl border transition-all duration-300 relative overflow-hidden',
            showIsoSection
              ? 'bg-slate-950/80 border-slate-800'
              : 'bg-slate-950/40 border-dashed border-slate-800/80 opacity-60'
          )}>
            {/* Top Scanning beam */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent pointer-events-none" />

            {/* ISO Seal Preview */}
            {showIsoSection && showIsoBadge && (
              <div className="flex justify-center -mt-6 sm:-mt-8 mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-b-xl border-x border-b border-blue-500/35 bg-slate-900/95 backdrop-blur-md shadow-[0_4px_14px_rgba(37,99,235,0.25)] select-none">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-xs font-extrabold tracking-wider text-blue-200 uppercase">
                    {isoNumber || 'ISO 27001:2022'}
                  </span>
                  {isoLabel && (
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      {isoLabel}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* If badge is hidden */}
            {showIsoSection && !showIsoBadge && (
              <div className="flex justify-center -mt-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                  <EyeOff className="h-3 w-3" />
                  ISO Seal Badge Hidden on Client Website
                </span>
              </div>
            )}

            {/* Entire Section Hidden Notice */}
            {!showIsoSection ? (
              <div className="py-8 text-center space-y-2">
                <EyeOff className="h-8 w-8 mx-auto text-slate-600" />
                <h4 className="text-sm font-bold text-slate-400">Performance Metrics & ISO Section is Hidden</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Public visitors to your client website will not see this entire section while this toggle is OFF.
                </p>
              </div>
            ) : (
              /* 4 Metric Cards Preview */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800 pt-2">
                <div className="p-2">
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
                    {uptimeValue || '99.99%'}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {uptimeLabel || 'SERVER UPTIME'}
                  </div>
                </div>

                <div className="p-2">
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
                    {savingsValue || '40%+'}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {savingsLabel || 'INFRASTRUCTURE SAVING'}
                  </div>
                </div>

                <div className="p-2">
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
                    {actionsValue || '10M+'}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {actionsLabel || 'API ACTIONS'}
                  </div>
                </div>

                <div className="p-2">
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
                    {slaValue || '100%'}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                    {slaLabel || 'ON-TIME SLA DELIVERY'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div className={cn(
            'p-4 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in',
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          )}>
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            )}
            <span className="font-semibold">{notice.message}</span>
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Visibility Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle 1: Show/Hide ISO Seal Badge */}
            <div
              onClick={handleToggleIsoBadge}
              className={cn(
                'p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between select-none',
                showIsoBadge
                  ? 'bg-slate-950/80 border-blue-500/30 hover:border-blue-500/50'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">ISO Number Seal Badge</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold px-2 py-0',
                      showIsoBadge
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    )}
                  >
                    {showIsoBadge ? 'Visible' : 'Hidden'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  Controls the floating ISO certification seal on the metrics container. Auto-saves live.
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <div className={cn(
                'w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ml-3',
                showIsoBadge ? 'bg-blue-600' : 'bg-slate-800'
              )}>
                <div className={cn(
                  'w-5 h-5 rounded-full bg-white transition-transform transform shadow-md',
                  showIsoBadge ? 'translate-x-5' : 'translate-x-0'
                )} />
              </div>
            </div>

            {/* Toggle 2: Show/Hide Entire Metrics Section */}
            <div
              onClick={handleToggleIsoSection}
              className={cn(
                'p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between select-none',
                showIsoSection
                  ? 'bg-slate-950/80 border-blue-500/30 hover:border-blue-500/50'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Entire Metrics & ISO Section</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold px-2 py-0',
                      showIsoSection
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    )}
                  >
                    {showIsoSection ? 'Active' : 'Section Hidden'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  Controls visibility of the entire metrics block on the client website.
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <div className={cn(
                'w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ml-3',
                showIsoSection ? 'bg-blue-600' : 'bg-slate-800'
              )}>
                <div className={cn(
                  'w-5 h-5 rounded-full bg-white transition-transform transform shadow-md',
                  showIsoSection ? 'translate-x-5' : 'translate-x-0'
                )} />
              </div>
            </div>
          </div>

          {/* ISO Details Inputs */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              ISO Certification Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  ISO Certification Number / Code
                </label>
                <Input
                  value={isoNumber}
                  onChange={(e) => setIsoNumber(e.target.value)}
                  placeholder="e.g. ISO 27001:2022 or ISO 9001:2015"
                  className="bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-600 font-mono text-xs rounded-xl h-10"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Displayed in bold capital font on the client seal badge.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Certification Status / Subtitle Label
                </label>
                <Input
                  value={isoLabel}
                  onChange={(e) => setIsoLabel(e.target.value)}
                  placeholder="e.g. Certified or Architecture"
                  className="bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-600 text-xs rounded-xl h-10"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Optional status label beside the ISO number (leave blank to omit).
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics Inputs */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-400" />
              Key Performance Metrics Tiles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1 */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Metric 1</span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Value</label>
                  <Input
                    value={uptimeValue}
                    onChange={(e) => setUptimeValue(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Label</label>
                  <Input
                    value={uptimeLabel}
                    onChange={(e) => setUptimeLabel(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Metric 2</span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Value</label>
                  <Input
                    value={savingsValue}
                    onChange={(e) => setSavingsValue(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Label</label>
                  <Input
                    value={savingsLabel}
                    onChange={(e) => setSavingsLabel(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Metric 3</span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Value</label>
                  <Input
                    value={actionsValue}
                    onChange={(e) => setActionsValue(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Label</label>
                  <Input
                    value={actionsLabel}
                    onChange={(e) => setActionsLabel(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
              </div>

              {/* Metric 4 */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Metric 4</span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Value</label>
                  <Input
                    value={slaValue}
                    onChange={(e) => setSlaValue(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Label</label>
                  <Input
                    value={slaLabel}
                    onChange={(e) => setSlaLabel(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs rounded-lg h-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white text-xs font-semibold gap-1.5 rounded-xl h-9"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs gap-2 rounded-xl h-10 px-6 shadow-lg shadow-blue-600/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving & Publishing...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Compliance Settings</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
