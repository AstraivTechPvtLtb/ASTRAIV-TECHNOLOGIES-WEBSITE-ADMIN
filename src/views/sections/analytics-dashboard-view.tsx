'use client';

/**
 * @file admin/src/views/sections/analytics-dashboard-view.tsx
 * @description [VIEW] Comprehensive Google Analytics 4 (GA4) telemetry dashboard.
 * Includes interactive Recharts visualizations, KPI cards, real-time telemetry,
 * top pages pagination, traffic source breakdowns, and device analytics.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Compass,
  Eye,
  Activity,
  Zap,
  Calendar,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Smartphone,
  Tablet,
  Globe2,
  Share2,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/views/ui/card';
import { Button } from '@/views/ui/button';
import { Badge } from '@/views/ui/badge';
import { Input } from '@/views/ui/input';
import {
  AnalyticsOverview,
  AnalyticsTimelinePoint,
  AnalyticsPageItem,
  AnalyticsSourceItem,
  AnalyticsDeviceItem,
  AnalyticsCountryItem,
  AnalyticsTechnology,
  AnalyticsRealtime,
} from '@/lib/google-analytics';

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#3b82f6', // blue-500
  mobile: '#10b981', // emerald-500
  tablet: '#f59e0b', // amber-500
};

export function AnalyticsDashboardView() {
  const [isMounted, setIsMounted] = useState(false);
  const [rangePreset, setRangePreset] = useState<DatePreset>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Data States
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsTimelinePoint[]>([]);
  const [pages, setPages] = useState<AnalyticsPageItem[]>([]);
  const [sources, setSources] = useState<AnalyticsSourceItem[]>([]);
  const [devices, setDevices] = useState<AnalyticsDeviceItem[]>([]);
  const [countries, setCountries] = useState<AnalyticsCountryItem[]>([]);
  const [technology, setTechnology] = useState<AnalyticsTechnology | null>(null);
  const [realtime, setRealtime] = useState<AnalyticsRealtime | null>(null);

  // Status States
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [configReason, setConfigReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pages Table Pagination & Search
  const [pageSearch, setPageSearch] = useState<string>('');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const pageSize = 7;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch telemetry from API routes
  const fetchAnalytics = useCallback(async () => {
    setErrorMessage(null);
    setIsRefreshing(true);

    try {
      const query = new URLSearchParams();
      if (rangePreset === 'custom' && customStart && customEnd) {
        query.set('startDate', customStart);
        query.set('endDate', customEnd);
      } else {
        query.set('range', rangePreset);
      }

      const queryString = query.toString() ? `?${query.toString()}` : '';

      const [
        overviewRes,
        usersRes,
        pagesRes,
        sourcesRes,
        devicesRes,
        countriesRes,
        realtimeRes,
      ] = await Promise.all([
        fetch(`/api/analytics/overview${queryString}`),
        fetch(`/api/analytics/users${queryString}`),
        fetch(`/api/analytics/pages${queryString}`),
        fetch(`/api/analytics/sources${queryString}`),
        fetch(`/api/analytics/devices${queryString}`),
        fetch(`/api/analytics/countries${queryString}`),
        fetch('/api/analytics/realtime'),
      ]);

      const [
        overviewData,
        usersData,
        pagesData,
        sourcesData,
        devicesData,
        countriesData,
        realtimeData,
      ] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        pagesRes.json(),
        sourcesRes.json(),
        devicesRes.json(),
        countriesRes.json(),
        realtimeRes.json(),
      ]);

      if (!overviewRes.ok || !overviewData.success) {
        throw new Error(overviewData.error || 'Failed to fetch analytics overview.');
      }

      setOverview(overviewData.data);
      setIsConfigured(overviewData.configured ?? true);
      setConfigReason(overviewData.configReason || null);

      if (usersData.success) setTimeline(usersData.data || []);
      if (pagesData.success) setPages(pagesData.data || []);
      if (sourcesData.success) setSources(sourcesData.data || []);
      if (devicesData.success) {
        setDevices(devicesData.data?.devices || []);
        setTechnology(devicesData.data?.technology || null);
      }
      if (countriesData.success) setCountries(countriesData.data || []);
      if (realtimeData.success) setRealtime(realtimeData.data || null);
    } catch (err) {
      console.error('[Analytics View Error]:', err);
      setErrorMessage((err as Error)?.message || 'An error occurred while loading analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rangePreset, customStart, customEnd]);

  // Initial fetch and dependency trigger
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh real-time data every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetch('/api/analytics/realtime')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data.data) {
            setRealtime(data.data);
          }
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Filtered and paginated pages
  const filteredPages = useMemo(() => {
    if (!pageSearch.trim()) return pages;
    const q = pageSearch.toLowerCase();
    return pages.filter(
      (p) => p.path.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
    );
  }, [pages, pageSearch]);

  const paginatedPages = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredPages.slice(start, start + pageSize);
  }, [filteredPages, pageNumber]);

  const totalPagesCount = Math.max(1, Math.ceil(filteredPages.length / pageSize));

  // Device chart formatted data
  const devicePieData = useMemo(() => {
    return devices.map((d) => ({
      name: d.category.charAt(0).toUpperCase() + d.category.slice(1),
      value: d.users,
      percentage: d.percentage,
      color: DEVICE_COLORS[d.category.toLowerCase()] || '#64748b',
    }));
  }, [devices]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl">
      {/* Header Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        {/* Real-time telemetry badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  {realtime ? realtime.activeUsers : 0} Active Users
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Live
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Real-time active visitors on website
              </span>
            </div>
          </div>
        </div>

        {/* Date Presets & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs">
            {(['7d', '30d', '90d'] as DatePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setRangePreset(preset);
                  setIsCustomOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  rangePreset === preset && !isCustomOpen
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset === '7d' ? 'Last 7 Days' : preset === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
            <button
              onClick={() => {
                setIsCustomOpen(!isCustomOpen);
                setRangePreset('custom');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                rangePreset === 'custom' || isCustomOpen
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Custom</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="h-9 px-3 border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-850 hover:text-white rounded-xl"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline text-xs font-semibold">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Custom Date Range Dropdown / Bar */}
      {isCustomOpen && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-end gap-4 animate-in fade-in duration-150">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Start Date
            </label>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs h-9 w-44 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              End Date
            </label>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white text-xs h-9 w-44 rounded-xl"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (customStart && customEnd) {
                setRangePreset('custom');
                fetchAnalytics();
              }
            }}
            disabled={!customStart || !customEnd || isRefreshing}
            className="h-9 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl px-4"
          >
            Apply Range
          </Button>
        </div>
      )}

      {/* Friendly Error State */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-white">Failed to load analytics</h5>
              <p className="text-xs text-slate-400 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            className="border-red-800 text-red-300 hover:bg-red-900/40 text-xs font-bold rounded-xl"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="bg-slate-900/80 border-slate-800 p-5 rounded-2xl animate-pulse">
              <div className="h-3 w-16 bg-slate-800 rounded mb-3" />
              <div className="h-7 w-24 bg-slate-800 rounded mb-2" />
              <div className="h-2.5 w-20 bg-slate-800 rounded" />
            </Card>
          ))
        ) : (
          <>
            {/* 1. Total Users */}
            <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Total Users</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2 tracking-tight">
                  {overview ? overview.totalUsers.toLocaleString() : '0'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Distinct visitors</p>
              </CardContent>
            </Card>

            {/* 2. New Users */}
            <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">New Users</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <UserPlus className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2 tracking-tight">
                  {overview ? overview.newUsers.toLocaleString() : '0'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">First-time visitors</p>
              </CardContent>
            </Card>

            {/* 3. Sessions */}
            <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Sessions</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Compass className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2 tracking-tight">
                  {overview ? overview.sessions.toLocaleString() : '0'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Browsing sessions</p>
              </CardContent>
            </Card>

            {/* 4. Page Views */}
            <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Page Views</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2 tracking-tight">
                  {overview ? overview.screenPageViews.toLocaleString() : '0'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Total screens viewed</p>
              </CardContent>
            </Card>

            {/* 5. Engagement Rate */}
            <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Engagement</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2 tracking-tight">
                  {overview ? `${overview.engagementRate}%` : '0%'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Engaged sessions</p>
              </CardContent>
            </Card>

            {/* 6. Event Count */}
            <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors rounded-2xl overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Event Count</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2 tracking-tight">
                  {overview ? overview.eventCount.toLocaleString() : '0'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">GA4 interactions</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Users & Sessions Over Time Chart */}
      <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Users & Sessions Over Time</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily telemetry trend of active visitors and session volume
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-slate-300 font-semibold">Users</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              <span className="text-slate-300 font-semibold">Sessions</span>
            </div>
          </div>
        </div>

        <div className="pt-6 h-80 w-full">
          {isLoading || !isMounted ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
                <span className="text-xs text-slate-400">Loading timeline telemetry...</span>
              </div>
            </div>
          ) : timeline.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-xs text-slate-500">No analytics data available for this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as AnalyticsTimelinePoint;
                      return (
                        <div className="p-3 bg-slate-950/95 border border-slate-800 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {data.displayDate} ({data.date})
                          </div>
                          <div className="flex items-center justify-between gap-4 text-blue-400 font-semibold">
                            <span>Users:</span>
                            <span className="font-bold">{data.users.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-purple-400 font-semibold">
                            <span>Sessions:</span>
                            <span className="font-bold">{data.sessions.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-400">
                            <span>New Users:</span>
                            <span>{data.newUsers.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#userGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#sessionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* 2-Column Section: Top Pages & Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Most Visited Pages Table (7 Cols) */}
        <Card className="lg:col-span-7 bg-slate-900/80 border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Most Visited Pages</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Top content by page views and user engagement</p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Filter page..."
                  value={pageSearch}
                  onChange={(e) => {
                    setPageSearch(e.target.value);
                    setPageNumber(1);
                  }}
                  className="pl-8 h-8 text-xs bg-slate-950 border-slate-800 rounded-xl"
                />
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-500">Loading page analytics...</span>
                </div>
              ) : paginatedPages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No pages found matching your search.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Page Path</th>
                      <th className="pb-3 text-right font-semibold">Views</th>
                      <th className="pb-3 text-right font-semibold">Users</th>
                      <th className="pb-3 text-right font-semibold">Avg Time</th>
                      <th className="pb-3 text-right font-semibold">Traffic Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {paginatedPages.map((page, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pr-2 max-w-[200px]">
                          <div className="font-bold text-slate-200 truncate">{page.path}</div>
                          <div className="text-[11px] text-slate-400 truncate">{page.title}</div>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-100">
                          {page.pageViews.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-slate-400 font-mono">
                          {page.users.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-slate-400">
                          {page.avgEngagementTime}s
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, page.percentage)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 w-9 text-right">
                              {page.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPagesCount > 1 && (
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                Page {pageNumber} of {totalPagesCount} ({filteredPages.length} total pages)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber === 1}
                  className="h-7 w-7 p-0 border-slate-800 rounded-lg"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageNumber((p) => Math.min(totalPagesCount, p + 1))}
                  disabled={pageNumber === totalPagesCount}
                  className="h-7 w-7 p-0 border-slate-800 rounded-lg"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Traffic Sources (5 Cols) */}
        <Card className="lg:col-span-5 bg-slate-900/80 border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Traffic Sources</h3>
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                Source / Medium
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading sources...</div>
              ) : sources.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No traffic sources recorded.</div>
              ) : (
                sources.slice(0, 6).map((src, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 truncate">{src.channel}</span>
                      <span className="font-mono text-[11px] font-bold text-white">
                        {src.sessions.toLocaleString()} sessions
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{src.users.toLocaleString()} users</span>
                      <span>{src.percentage}% of traffic</span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, src.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Primary Channels</span>
            <span className="font-semibold text-slate-300">Organic & Direct Leading</span>
          </div>
        </Card>
      </div>

      {/* 2-Column Section: Device Breakdown & Country Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Device Analytics Donut (5 Cols) */}
        <Card className="lg:col-span-5 bg-slate-900/80 border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Laptop className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Device Analytics</h3>
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                Category Split
              </Badge>
            </div>

            <div className="mt-4 h-52 w-full flex items-center justify-center">
              {isLoading || !isMounted ? (
                <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
              ) : devicePieData.length === 0 ? (
                <p className="text-xs text-slate-500">No device data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devicePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {devicePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                              <div className="font-bold text-white">{item.name}</div>
                              <div className="text-slate-300">
                                {item.value.toLocaleString()} users ({item.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Device Legend Cards */}
            <div className="grid grid-cols-3 gap-2.5 mt-2">
              {devices.map((dev) => {
                const isDesktop = dev.category.toLowerCase() === 'desktop';
                const isMobile = dev.category.toLowerCase() === 'mobile';
                const Icon = isDesktop ? Laptop : isMobile ? Smartphone : Tablet;
                const color = DEVICE_COLORS[dev.category.toLowerCase()] || '#64748b';

                return (
                  <div
                    key={dev.category}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1"
                  >
                    <div className="flex items-center justify-center gap-1.5" style={{ color }}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold capitalize">{dev.category}</span>
                    </div>
                    <div className="text-base font-extrabold text-white">{dev.percentage}%</div>
                    <div className="text-[10px] text-slate-500">{dev.users.toLocaleString()} users</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Country Analytics Table (7 Cols) */}
        <Card className="lg:col-span-7 bg-slate-900/80 border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Country Analytics</h3>
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                Top Geographic Markets
              </Badge>
            </div>

            <div className="mt-4 overflow-x-auto">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading countries...</div>
              ) : countries.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No country data recorded.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Country</th>
                      <th className="pb-3 text-right font-semibold">Users</th>
                      <th className="pb-3 text-right font-semibold">Sessions</th>
                      <th className="pb-3 text-right font-semibold">Traffic Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {countries.slice(0, 6).map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-bold text-slate-200">{c.country}</td>
                        <td className="py-3 text-right font-mono text-slate-100">
                          {c.users.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-400">
                          {c.sessions.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, c.percentage)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                              {c.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Global Audience Reach</span>
            <span className="font-semibold text-slate-300">
              {countries.length} Identified Territories
            </span>
          </div>
        </Card>
      </div>

      {/* Technology & Browsers Breakdown */}
      {technology && (
        <Card className="bg-slate-900/80 border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-4.5 w-4.5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Browser & Operating System Telemetry</h3>
            </div>
            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
              Client Stack
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Top Browsers */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Browsers</h4>
              <div className="space-y-2.5">
                {technology.browsers.slice(0, 4).map((b, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{b.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {b.users.toLocaleString()} ({b.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Operating Systems */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Operating Systems
              </h4>
              <div className="space-y-2.5">
                {technology.operatingSystems.slice(0, 4).map((os, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{os.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {os.users.toLocaleString()} ({os.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, os.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
