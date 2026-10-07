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

function HeadlinePreview({ text }: { text: string }) {
  if (!text || !text.trim()) {
    return <span className="text-slate-500 italic text-xs">Enter a headline to see live client typography preview</span>;
  }

  const rawTokens = text.trim().split(/\s+/);
  const words: { word: string; isHighlighted: boolean }[] = [];
  let inHighlight = false;
  let hasExplicitHighlight = false;

  for (const token of rawTokens) {
    if (!token) continue;
    let currentToken = token;

    if (currentToken.includes('[')) {
      inHighlight = true;
      hasExplicitHighlight = true;
      currentToken = currentToken.replace(/\[/g, '');
    }

    const highlighted = inHighlight;

    if (currentToken.includes(']')) {
      inHighlight = false;
      currentToken = currentToken.replace(/\]/g, '');
    }

    if (currentToken) {
      words.push({
        word: currentToken,
        isHighlighted: highlighted,
      });
    }
  }

  if (!hasExplicitHighlight && words.length > 0) {
    if (words.length === 1) {
      words[0].isHighlighted = true;
    } else {
      const splitIndex = Math.ceil(words.length / 2);
      for (let i = splitIndex; i < words.length; i++) {
        words[i].isHighlighted = true;
      }
    }
  }

  return (
    <div className="space-y-2.5 mt-2.5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs">
        {/* Light Theme Client Preview */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Light Client Mode</span>
            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">50% Gradient</span>
          </div>
          <p className="text-sm font-bold text-[#0F172A] leading-snug">
            {words.map((item, idx) => (
              <span
                key={idx}
                className={
                  item.isHighlighted
                    ? "bg-linear-to-r from-[#0B3D91] via-[#1D4ED8] to-[#2563EB] bg-clip-text text-transparent font-extrabold"
                    : "text-[#0F172A]"
                }
              >
                {item.word}{idx < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>

        {/* Dark Theme Client Preview */}
        <div className="p-3 rounded-xl bg-[#080C14] border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dark Client Mode</span>
            <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">50% Gradient</span>
          </div>
          <p className="text-sm font-bold text-[#F8FAFC] leading-snug">
            {words.map((item, idx) => (
              <span
                key={idx}
                className={
                  item.isHighlighted
                    ? "bg-linear-to-r from-[#38BDF8] via-[#60A5FA] to-[#93C5FD] bg-clip-text text-transparent font-extrabold"
                    : "text-[#F8FAFC]"
                }
              >
                {item.word}{idx < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 leading-normal">
        <span className="text-blue-400 font-semibold">Strict 50% Gradient Policy:</span> The first ~50% displays as standard solid foreground and the second ~50% automatically transitions through the Astraiv signature gradient across client light & dark modes. (You can also wrap words in <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300 font-mono text-[10px]">[brackets]</code> for custom highlighting).
      </p>
    </div>
  );
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
  const [companyHeadline, setCompanyHeadline] = useState((initialCompany?.headline as string) || (initialCompany?.companyHeadline as string) || 'Software Craftsmanship Driven by First-Principles Engineering');
  const [companyStory, setCompanyStory] = useState((initialCompany?.story as string) || (initialCompany?.companyStory as string) || 'Astraiv Technologies was founded with a singular conviction: enterprise software must be engineered with uncompromising architectural precision, absolute client IP ownership, and zero technical bloat.');
  const [companyValues, setCompanyValues] = useState((initialCompany?.values as string) || (initialCompany?.companyValues as string) || '1. Engineering Excellence Over Bloat\n2. 100% Unencumbered Client IP\n3. Transparent Agile Velocity\n4. Strict Institutional Security (ISO 27001)');

  // Process Fields
  const [processHeadline, setProcessHeadline] = useState((initialProcess?.headline as string) || (initialProcess?.processHeadline as string) || 'Disciplined 6-Stage Engineering Delivery Roadmap');
  const [processStages, setProcessStages] = useState((initialProcess?.stages as string) || (initialProcess?.processStages as string) || '1. Discover: Deep architectural scoping and requirement taxonomy\n2. Strategize: Database schemas, tech stack selection, and milestone SOW\n3. Design: High-fidelity prototypes and design systems\n4. Build: Type-safe sprints with automated CI/CD security gates\n5. Launch: Zero-downtime production deployment and edge routing\n6. Scale: 24/7 telemetry monitoring and proactive SLA optimization');

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
      sections = { headline: companyHeadline, companyHeadline, story: companyStory, values: companyValues };
    } else if (pageKey === 'process') {
      title = 'Engineering Process Content';
      sections = { headline: processHeadline, processHeadline, stages: processStages };
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
                placeholder="e.g. We engineer the digital future"
              />
              <HeadlinePreview text={heroHeadline} />
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
                placeholder="e.g. Software Craftsmanship Driven by First-Principles Engineering"
              />
              <HeadlinePreview text={companyHeadline} />
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
                placeholder="e.g. Disciplined 6-Stage Engineering Delivery Roadmap"
              />
              <HeadlinePreview text={processHeadline} />
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
