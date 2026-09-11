'use client';

/**
 * @file admin/src/views/tables/pricing-table.tsx
 * @description [VIEW] Interactive management table and modal dialogs for Pricing Plans & Engagement Models.
 */

import { useState } from 'react';
import { AdminPricingPlan } from '@/models/types';
import {
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
  reorderPricingPlan,
  togglePricingPlanStatus,
} from '@/controllers/pricing.controller';
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
  CreditCard,
  Check,
  Sparkles,
  ExternalLink,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';

interface PricingTableProps {
  initialData: AdminPricingPlan[];
}

export function PricingTable({ initialData }: PricingTableProps) {
  const [data, setData] = useState<AdminPricingPlan[]>(initialData);
  const [previewCycle, setPreviewCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPricingPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [priceType, setPriceType] = useState<'fixed' | 'custom'>('fixed');
  const [priceMonthlyInr, setPriceMonthlyInr] = useState<number | string>(399999);
  const [priceYearlyInr, setPriceYearlyInr] = useState<number | string>(319999);
  const [priceMonthlyUsd, setPriceMonthlyUsd] = useState<number | string>(4999);
  const [priceYearlyUsd, setPriceYearlyUsd] = useState<number | string>(3999);
  const [customPriceLabel, setCustomPriceLabel] = useState('Custom');
  const [featuresText, setFeaturesText] = useState('');
  const [buttonText, setButtonText] = useState('Start Building');
  const [buttonUrl, setButtonUrl] = useState('/contact');
  const [active, setActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);

  const activeCount = data.filter((p) => p.active).length;
  const popularPlan = data.find((p) => p.isPopular);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('Ideal for startups needing a reliable, scalable development team.');
    setBadge('');
    setIsPopular(false);
    setPriceType('fixed');
    setPriceMonthlyInr(399999);
    setPriceYearlyInr(319999);
    setPriceMonthlyUsd(4999);
    setPriceYearlyUsd(3999);
    setCustomPriceLabel('Custom');
    setFeaturesText(
      'Custom Web Architecture\nSEO & Core Web Vitals\nCloud CI/CD Deployment\nDedicated Support SLA'
    );
    setButtonText('Start Building');
    setButtonUrl('/contact');
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
    setPriceType(plan.priceType);
    setPriceMonthlyInr(plan.priceMonthlyInr ?? '');
    setPriceYearlyInr(plan.priceYearlyInr ?? '');
    setPriceMonthlyUsd(plan.priceMonthlyUsd ?? '');
    setPriceYearlyUsd(plan.priceYearlyUsd ?? '');
    setCustomPriceLabel(plan.customPriceLabel || 'Custom');
    setFeaturesText((plan.features || []).join('\n'));
    setButtonText(plan.buttonText || 'Start Building');
    setButtonUrl(plan.buttonUrl || '/contact');
    setActive(plan.active);
    setOrderIndex(plan.orderIndex);
    setIsModalOpen(true);
  };

  const handlePriceTypeToggle = (type: 'fixed' | 'custom') => {
    setPriceType(type);
    if (type === 'custom') {
      setCustomPriceLabel('Custom');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Please fill in the Plan Name and Description.');
      return;
    }

    setIsSubmitting(true);
    const parsedFeatures = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const monthlyInr = priceType === 'fixed' && priceMonthlyInr !== '' ? Number(priceMonthlyInr) : null;
    const yearlyInr = priceType === 'fixed' && priceYearlyInr !== '' ? Number(priceYearlyInr) : null;
    const monthlyUsd = priceType === 'fixed' && priceMonthlyUsd !== '' ? Number(priceMonthlyUsd) : null;
    const yearlyUsd = priceType === 'fixed' && priceYearlyUsd !== '' ? Number(priceYearlyUsd) : null;

    try {
      if (editingPlan) {
        const res = await updatePricingPlan(editingPlan.id, {
          name: name.trim(),
          description: description.trim(),
          badge: badge.trim() || (isPopular ? 'MOST POPULAR' : null),
          isPopular,
          priceType,
          priceMonthlyInr: monthlyInr,
          priceYearlyInr: yearlyInr,
          priceMonthlyUsd: monthlyUsd,
          priceYearlyUsd: yearlyUsd,
          customPriceLabel: priceType === 'custom' ? customPriceLabel.trim() || 'Custom' : null,
          features: parsedFeatures,
          buttonText: buttonText.trim() || 'Start Building',
          buttonUrl: buttonUrl.trim() || '/contact',
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
                    priceType,
                    priceMonthlyInr: monthlyInr,
                    priceYearlyInr: yearlyInr,
                    priceMonthlyUsd: monthlyUsd,
                    priceYearlyUsd: yearlyUsd,
                    customPriceLabel: priceType === 'custom' ? customPriceLabel.trim() || 'Custom' : null,
                    features: parsedFeatures,
                    buttonText: buttonText.trim() || 'Start Building',
                    buttonUrl: buttonUrl.trim() || '/contact',
                    active,
                    orderIndex,
                  }
                : p
            )
          );
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to update pricing plan');
        }
      } else {
        const res = await createPricingPlan({
          name: name.trim(),
          description: description.trim(),
          badge: badge.trim() || (isPopular ? 'MOST POPULAR' : null),
          isPopular,
          priceType,
          priceMonthlyInr: monthlyInr,
          priceYearlyInr: yearlyInr,
          priceMonthlyUsd: monthlyUsd,
          priceYearlyUsd: yearlyUsd,
          customPriceLabel: priceType === 'custom' ? customPriceLabel.trim() || 'Custom' : null,
          features: parsedFeatures,
          buttonText: buttonText.trim() || 'Start Building',
          buttonUrl: buttonUrl.trim() || '/contact',
          active,
          orderIndex,
        });

        if (res.success && res.data) {
          setData((prev) => [...prev, res.data as AdminPricingPlan]);
          setIsModalOpen(false);
        } else {
          alert(res.error || 'Failed to create pricing plan');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, planName: string) => {
    if (!confirm(`Are you sure you want to remove the plan "${planName}"? This will immediately remove it from the client website pricing section.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await deletePricingPlan(id);
      if (res.success) {
        setData((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || 'Failed to delete plan');
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

  const formatCurrencyInr = (amount?: number | null) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyUsd = (amount?: number | null) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Plans
            </span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {data.length}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Configured engagement tiers
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Tiers
            </span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-500/80 mt-0.5 block">
              Displayed on client website
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
            <span className="text-lg font-bold text-blue-400 mt-1 block truncate max-w-[160px]">
              {popularPlan ? popularPlan.name : 'None selected'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Marked as &quot;MOST POPULAR&quot;
            </span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white">Engagement Models & Pricing Plans</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized directly with the client website <span className="font-mono text-blue-400">/en/company#pricing</span>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="http://localhost:3000/en/company#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Preview Client Pricing</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer h-9 px-4"
          >
            <Plus className="h-4 w-4" /> Add New Plan
          </Button>
        </div>
      </div>

      {/* Interactive Visual Cards Grid (Live Admin Preview) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Visual Tier Cards Preview
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className={cn('font-semibold cursor-pointer', previewCycle === 'monthly' ? 'text-blue-400' : 'text-slate-500')} onClick={() => setPreviewCycle('monthly')}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setPreviewCycle(previewCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-9 h-5 bg-slate-800 rounded-full p-0.5 relative transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-blue-500 transition-transform',
                  previewCycle === 'yearly' ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
            <span className={cn('font-semibold cursor-pointer', previewCycle === 'yearly' ? 'text-blue-400' : 'text-slate-500')} onClick={() => setPreviewCycle('yearly')}>
              Annual (20% Off)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {data.map((plan) => {
            const displayPrice =
              plan.priceType === 'custom'
                ? plan.customPriceLabel || 'Custom'
                : previewCycle === 'monthly'
                ? formatCurrencyInr(plan.priceMonthlyInr)
                : formatCurrencyInr(plan.priceYearlyInr);

            return (
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

                  <p className="text-xs text-slate-400 leading-relaxed mb-5 min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="mb-6 pb-6 border-b border-slate-800">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {displayPrice}
                    </span>
                    {plan.priceType === 'fixed' && (
                      <span className="text-xs font-semibold text-slate-400 ml-1">
                        /{previewCycle === 'monthly' ? 'mo' : 'mo (billed annually)'}
                      </span>
                    )}
                    {plan.priceType === 'fixed' && plan.priceMonthlyUsd && (
                      <span className="block text-[11px] font-mono text-slate-500 mt-1">
                        USD: {previewCycle === 'monthly' ? formatCurrencyUsd(plan.priceMonthlyUsd) : formatCurrencyUsd(plan.priceYearlyUsd)}/mo
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-6">
                    {(plan.features || []).map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-slate-800 text-slate-200 border border-slate-700">
                    {plan.buttonText}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => openEditModal(plan)}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Details & Amount
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
            );
          })}
        </div>
      </div>

      {/* Plans Detailed Data Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            All Configured Plans & Pricing Tiers
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-4 px-4 w-20">Order</th>
                <th className="py-4 px-4">Plan Name</th>
                <th className="py-4 px-4">Monthly (INR / USD)</th>
                <th className="py-4 px-4">Annual (INR / USD)</th>
                <th className="py-4 px-4">Features</th>
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
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(plan.id, 'down')}
                          disabled={idx === data.length - 1}
                          className="text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-slate-300">#{plan.orderIndex}</span>
                    </div>
                  </td>

                  {/* Plan Name */}
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
                      <span className="text-slate-400 text-[11px] line-clamp-1">
                        {plan.description}
                      </span>
                    </div>
                  </td>

                  {/* Monthly Price */}
                  <td className="py-4 px-4 font-mono">
                    {plan.priceType === 'custom' ? (
                      <span className="font-bold text-amber-400">{plan.customPriceLabel || 'Custom'}</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{formatCurrencyInr(plan.priceMonthlyInr)}</span>
                        <span className="text-[10px] text-slate-400">{formatCurrencyUsd(plan.priceMonthlyUsd)}</span>
                      </div>
                    )}
                  </td>

                  {/* Annual Price */}
                  <td className="py-4 px-4 font-mono">
                    {plan.priceType === 'custom' ? (
                      <span className="text-slate-500">—</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-400">{formatCurrencyInr(plan.priceYearlyInr)}</span>
                        <span className="text-[10px] text-slate-400">{formatCurrencyUsd(plan.priceYearlyUsd)}</span>
                      </div>
                    )}
                  </td>

                  {/* Features */}
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold text-[11px]">
                      {(plan.features || []).length} features
                    </span>
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
                        title="Edit Plan"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id, plan.name)}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove Plan"
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

      {/* Create / Edit Plan Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPlan ? 'Edit Pricing Plan & Amounts' : 'Add New Pricing Plan'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingPlan
                      ? 'Adjust price amounts, features, popular tags, and button texts.'
                      : 'Create a new engagement tier for the client website pricing section.'}
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
              {/* Plan Name & Popular Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    Plan Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Starter Plan, Professional Plan"
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
                  Plan Description <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Ideal for early-stage startups needing a premium marketing website."
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>

              {/* Pricing Type Switcher */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-300 block">Pricing Model</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePriceTypeToggle('fixed')}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      priceType === 'fixed'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    )}
                  >
                    Fixed Price Tier
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriceTypeToggle('custom')}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      priceType === 'custom'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    )}
                  >
                    Custom Quote (Enterprise)
                  </button>
                </div>
              </div>

              {/* Fixed Price Inputs */}
              {priceType === 'fixed' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Monthly Amount (INR ₹)</span>
                      <span className="text-[10px] text-blue-400">e.g. 399999</span>
                    </label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={priceMonthlyInr}
                      onChange={(e) => setPriceMonthlyInr(e.target.value)}
                      placeholder="399999"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Annual / Year Amount (INR ₹)</span>
                      <span className="text-[10px] text-emerald-400">Save 20% e.g. 319999</span>
                    </label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={priceYearlyInr}
                      onChange={(e) => setPriceYearlyInr(e.target.value)}
                      placeholder="319999"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Monthly Amount (USD $)</span>
                      <span className="text-[10px] text-blue-400">e.g. 4999</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={priceMonthlyUsd}
                      onChange={(e) => setPriceMonthlyUsd(e.target.value)}
                      placeholder="4999"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Annual / Year Amount (USD $)</span>
                      <span className="text-[10px] text-emerald-400">Save 20% e.g. 3999</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={priceYearlyUsd}
                      onChange={(e) => setPriceYearlyUsd(e.target.value)}
                      placeholder="3999"
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Custom Display Label
                  </label>
                  <Input
                    type="text"
                    value={customPriceLabel}
                    onChange={(e) => setCustomPriceLabel(e.target.value)}
                    placeholder="e.g. Custom or Contact Us"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    Will display prominently as &quot;Custom&quot; with consultation CTA.
                  </p>
                </div>
              )}

              {/* Features List */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Included Features (one per line)</span>
                  <span className="text-[11px] text-slate-500">Each line renders as a checkmark</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Custom Web Design (Framer/Next.js)&#10;SEO & Performance Tuning&#10;Production Deployment & CI/CD&#10;Dedicated Support"
                  className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 resize-none font-mono leading-relaxed"
                />
              </div>

              {/* Button & Link & Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">CTA Button Text</label>
                  <Input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Start Building or Hire Our Architects"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">CTA Button URL</label>
                  <Input
                    type="text"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="/contact"
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
                    'Save Plan & Amounts'
                  ) : (
                    'Create Plan'
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
