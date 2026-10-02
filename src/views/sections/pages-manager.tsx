'use client';

/**
 * @file admin/src/views/sections/pages-manager.tsx
 * @description [VIEW] Standalone Page Content Manager (Homepage, Company/About, Process).
 */

import { useState } from 'react';
import { savePageContent } from '@/controllers/pages.controller';
import {
  Layers,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Shield,
  Clock,
  Compass,
  Building,
} from 'lucide-react';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

interface PagesManagerProps {
  initialHomepage?: Record<string, unknown>;
  initialCompany?: Record<string, unknown>;
  initialProcess?: Record<string, unknown>;
}

export function PagesManager({ initialHomepage, initialCompany, initialProcess }: PagesManagerProps) {
  const [activeTab, setActiveTab] = useState<'homepage' | 'company' | 'process'>('homepage');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Homepage Fields
  const [heroHeadline, setHeroHeadline] = useState((initialHomepage?.heroHeadline as string) || 'We Engineer High-Performance Enterprise Software & AI Systems');
  const [heroSubheadline, setHeroSubheadline] = useState((initialHomepage?.heroSubheadline as string) || 'From multi-agent AI platforms to distributed cloud microservices, Astraiv constructs mission-critical software with clean architecture and zero legacy debt.');
  const [primaryCtaText, setPrimaryCtaText] = useState((initialHomepage?.primaryCtaText as string) || 'Start a Project');
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState((initialHomepage?.primaryCtaUrl as string) || '/start-project');
  const [secondaryCtaText, setSecondaryCtaText] = useState((initialHomepage?.secondaryCtaText as string) || 'Explore Case Studies');
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState((initialHomepage?.secondaryCtaUrl as string) || '/work');

  // Company Fields
  const [companyHeadline, setCompanyHeadline] = useState((initialCompany?.headline as string) || 'Software Craftsmanship Driven by First-Principles Engineering');
  const [companyStory, setCompanyStory] = useState((initialCompany?.story as string) || 'Astraiv Technologies was founded with a singular conviction: enterprise software must be engineered with uncompromising architectural precision, absolute client IP ownership, and zero technical bloat.');
  const [companyValues, setCompanyValues] = useState((initialCompany?.values as string) || '1. Engineering Excellence Over Bloat\n2. 100% Unencumbered Client IP\n3. Transparent Agile Velocity\n4. Strict Institutional Security (ISO 27001)');

  // Process Fields
  const [processHeadline, setProcessHeadline] = useState((initialProcess?.headline as string) || 'Disciplined 6-Stage Engineering Delivery Roadmap');
  const [processStages, setProcessStages] = useState((initialProcess?.stages as string) || '1. Discover: Deep architectural scoping and requirement taxonomy\n2. Strategize: Database schemas, tech stack selection, and milestone SOW\n3. Design: High-fidelity prototypes and design systems\n4. Build: Type-safe sprints with automated CI/CD security gates\n5. Launch: Zero-downtime production deployment and edge routing\n6. Scale: 24/7 telemetry monitoring and proactive SLA optimization');

  const handleSave = async (pageKey: 'homepage' | 'company' | 'process') => {
    setIsSaving(true);
    setFeedback(null);

    let title = 'Homepage';
    let sections: Record<string, unknown> = {};

    if (pageKey === 'homepage') {
      title = 'Homepage Content';
      sections = { heroHeadline, heroSubheadline, primaryCtaText, primaryCtaUrl, secondaryCtaText, secondaryCtaUrl };
    } else if (pageKey === 'company') {
      title = 'Company & About Content';
      sections = { headline: companyHeadline, story: companyStory, values: companyValues };
    } else if (pageKey === 'process') {
      title = 'Engineering Process Content';
      sections = { headline: processHeadline, stages: processStages };
    }

    try {
      const res = await savePageContent({
        pageKey,
        title,
        sections
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `${title} updated successfully.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to save page content.' });
      }
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error)?.message || 'An error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback message */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'homepage' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Homepage Hero & CTAs</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'company' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Company & About Page</span>
        </button>

        <button
          onClick={() => setActiveTab('process')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'process' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Process & Methodology</span>
        </button>
      </div>

      {/* HOMEPAGE FORM */}
      {activeTab === 'homepage' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Homepage Hero & Master CTAs</h3>
              <p className="text-xs text-slate-400">Configure global hero typography, value proposition, and conversion buttons.</p>
            </div>

            <Button
              onClick={() => handleSave('homepage')}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>Save Homepage</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hero Main Headline</label>
              <Input
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hero Subheadline</label>
              <textarea
                rows={3}
                value={heroSubheadline}
                onChange={(e) => setHeroSubheadline(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-3">
                <span className="text-xs font-bold text-blue-400">Primary CTA Button</span>
                <div className="space-y-2">
                  <Input
                    value={primaryCtaText}
                    onChange={(e) => setPrimaryCtaText(e.target.value)}
                    placeholder="Button Text (e.g. Start a Project)"
                    className="bg-slate-900 border-slate-800 text-xs"
                  />
                  <Input
                    value={primaryCtaUrl}
                    onChange={(e) => setPrimaryCtaUrl(e.target.value)}
                    placeholder="Destination URL (e.g. /start-project)"
                    className="bg-slate-900 border-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-3">
                <span className="text-xs font-bold text-slate-300">Secondary CTA Button</span>
                <div className="space-y-2">
                  <Input
                    value={secondaryCtaText}
                    onChange={(e) => setSecondaryCtaText(e.target.value)}
                    placeholder="Button Text (e.g. Explore Case Studies)"
                    className="bg-slate-900 border-slate-800 text-xs"
                  />
                  <Input
                    value={secondaryCtaUrl}
                    onChange={(e) => setSecondaryCtaUrl(e.target.value)}
                    placeholder="Destination URL (e.g. /work)"
                    className="bg-slate-900 border-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPANY FORM */}
      {activeTab === 'company' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Company, Mission & Core Values</h3>
              <p className="text-xs text-slate-400">Configure corporate narrative and value propositions.</p>
            </div>

            <Button
              onClick={() => handleSave('company')}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>Save Company Page</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Company Page Headline</label>
              <Input
                value={companyHeadline}
                onChange={(e) => setCompanyHeadline(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Corporate Origin & Story Narrative</label>
              <textarea
                rows={4}
                value={companyStory}
                onChange={(e) => setCompanyStory(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Core Engineering Values (One per line)</label>
              <textarea
                rows={4}
                value={companyValues}
                onChange={(e) => setCompanyValues(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* PROCESS FORM */}
      {activeTab === 'process' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Engineering Process & Delivery Roadmap</h3>
              <p className="text-xs text-slate-400">Configure the 6-stage roadmap and sprint guarantees.</p>
            </div>

            <Button
              onClick={() => handleSave('process')}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>Save Process Page</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Process Headline</label>
              <Input
                value={processHeadline}
                onChange={(e) => setProcessHeadline(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Delivery Roadmap Stages (One per line)</label>
              <textarea
                rows={7}
                value={processStages}
                onChange={(e) => setProcessStages(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 leading-relaxed font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
