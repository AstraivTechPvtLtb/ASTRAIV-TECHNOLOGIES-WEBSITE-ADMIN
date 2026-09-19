/**
 * @file admin/src/lib/google-analytics.ts
 * @description [SERVICE] Google Analytics 4 (GA4) Data API service integration.
 * Handles server-side authentication, in-memory caching with request deduplication,
 * report generation, and sanitized error handling.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'fs';
import path from 'path';

// Types for GA4 Reports
export interface AnalyticsOverview {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  screenPageViews: number;
  engagementRate: number; // Percentage e.g. 68.4
  eventCount: number;
  isDemoData?: boolean;
}

export interface AnalyticsTimelinePoint {
  date: string; // YYYY-MM-DD
  displayDate: string; // Formatted e.g. "Sep 12"
  users: number;
  sessions: number;
  newUsers: number;
}

export interface AnalyticsPageItem {
  path: string;
  title: string;
  pageViews: number;
  users: number;
  avgEngagementTime: number; // In seconds
  percentage: number;
}

export interface AnalyticsSourceItem {
  source: string;
  medium: string;
  channel: string; // Combined e.g. "google / organic"
  users: number;
  sessions: number;
  percentage: number;
}

export interface AnalyticsDeviceItem {
  category: 'desktop' | 'mobile' | 'tablet' | string;
  users: number;
  sessions: number;
  percentage: number;
}

export interface AnalyticsCountryItem {
  country: string;
  users: number;
  sessions: number;
  percentage: number;
}

export interface AnalyticsTechItem {
  name: string;
  users: number;
  percentage: number;
}

export interface AnalyticsTechnology {
  browsers: AnalyticsTechItem[];
  operatingSystems: AnalyticsTechItem[];
  deviceCategories: AnalyticsTechItem[];
}

export interface AnalyticsRealtime {
  activeUsers: number;
  topCountries: { country: string; activeUsers: number }[];
  topPages: { path: string; activeUsers: number }[];
  isDemoData?: boolean;
}

// In-Memory Cache Store with TTL & Promise Deduplication
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

const REPORT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REALTIME_CACHE_TTL_MS = 30 * 1000; // 30 seconds

async function fetchWithCache<T>(
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // Deduplicate simultaneous identical requests
  const existingPromise = pendingRequests.get(cacheKey) as Promise<T> | undefined;
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      memoryCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + ttlMs,
      });
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Checks if Google Analytics 4 environment variables and credentials are configured.
 */
export function isGoogleAnalyticsConfigured(): {
  configured: boolean;
  propertyId: string | null;
  reason?: string;
} {
  const propertyId = process.env.GA_PROPERTY_ID?.trim() || null;
  if (!propertyId || propertyId === '123456789' || propertyId.startsWith('YOUR_')) {
    return {
      configured: false,
      propertyId: null,
      reason: 'GA_PROPERTY_ID environment variable is missing or placeholder.',
    };
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const credentialsInline = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();

  if (credentialsPath) {
    const resolvedPath = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.resolve(process.cwd(), credentialsPath);
    if (fs.existsSync(resolvedPath)) {
      return { configured: true, propertyId };
    }
  }

  if (credentialsInline || clientEmail) {
    return { configured: true, propertyId };
  }

  return {
    configured: false,
    propertyId,
    reason:
      'Google service account credentials not found. Provide GOOGLE_APPLICATION_CREDENTIALS file path or GOOGLE_SERVICE_ACCOUNT_KEY.',
  };
}

/**
 * Instantiates the BetaAnalyticsDataClient with supported credential sources.
 */
let clientInstance: BetaAnalyticsDataClient | null = null;

function getAnalyticsClient(): BetaAnalyticsDataClient {
  if (clientInstance) {
    return clientInstance;
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const credentialsInline = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();

  if (credentialsPath) {
    const resolvedPath = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.resolve(process.cwd(), credentialsPath);

    if (fs.existsSync(resolvedPath)) {
      clientInstance = new BetaAnalyticsDataClient({
        keyFilename: resolvedPath,
      });
      return clientInstance;
    }
  }

  if (credentialsInline) {
    try {
      const parsed = JSON.parse(
        credentialsInline.startsWith('{')
          ? credentialsInline
          : Buffer.from(credentialsInline, 'base64').toString('utf8')
      );
      clientInstance = new BetaAnalyticsDataClient({
        credentials: {
          client_email: parsed.client_email,
          private_key: parsed.private_key?.replace(/\\n/g, '\n'),
        },
        projectId: parsed.project_id,
      });
      return clientInstance;
    } catch (e) {
      console.error('[GA4 Auth Error]: Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON', e);
    }
  }

  if (clientEmail && privateKey) {
    clientInstance = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });
    return clientInstance;
  }

  // Fallback to default Google Application Credentials discovery
  clientInstance = new BetaAnalyticsDataClient();
  return clientInstance;
}

/**
 * Normalizes input date range parameters into GA4 API date expressions.
 */
export function normalizeDateRange(
  range?: string | null,
  customStart?: string | null,
  customEnd?: string | null
): { startDate: string; endDate: string; label: string } {
  if (customStart && customEnd) {
    return {
      startDate: customStart,
      endDate: customEnd,
      label: `${customStart} to ${customEnd}`,
    };
  }

  switch (range?.toLowerCase()) {
    case '7d':
    case 'last7days':
      return { startDate: '7daysAgo', endDate: 'today', label: 'Last 7 Days' };
    case '90d':
    case 'last90days':
      return { startDate: '90daysAgo', endDate: 'today', label: 'Last 90 Days' };
    case '30d':
    case 'last30days':
    default:
      return { startDate: '30daysAgo', endDate: 'today', label: 'Last 30 Days' };
  }
}

/**
 * Generates realistic demonstration data for immediate UI preview when GA4 credentials are not yet added.
 */
function getDemoAnalytics(range: { startDate: string; endDate: string }) {
  const days = range.startDate === '7daysAgo' ? 7 : range.startDate === '90daysAgo' ? 90 : 30;
  const factor = days / 30;

  const totalUsers = Math.round(3840 * factor);
  const newUsers = Math.round(2910 * factor);
  const sessions = Math.round(5420 * factor);
  const screenPageViews = Math.round(18740 * factor);
  const engagementRate = 67.8;
  const eventCount = Math.round(41200 * factor);

  const timeline: AnalyticsTimelinePoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const wave = Math.sin((i / days) * Math.PI * 4) * 35;
    const baseUsers = Math.max(20, Math.round(120 + wave + (Math.random() * 40 - 20)));
    const baseSessions = Math.round(baseUsers * (1.3 + Math.random() * 0.2));
    const baseNew = Math.round(baseUsers * 0.75);

    timeline.push({
      date: dateStr,
      displayDate,
      users: baseUsers,
      sessions: baseSessions,
      newUsers: baseNew,
    });
  }

  const pages: AnalyticsPageItem[] = [
    { path: '/', title: 'Home | Astraiv Technologies', pageViews: 7420, users: 2850, avgEngagementTime: 48, percentage: 39.6 },
    { path: '/services', title: 'Services Catalog | Enterprise Solutions', pageViews: 3280, users: 1450, avgEngagementTime: 62, percentage: 17.5 },
    { path: '/projects', title: 'Case Studies & Portfolio', pageViews: 2410, users: 1120, avgEngagementTime: 55, percentage: 12.8 },
    { path: '/pricing', title: 'Service Pricing & Engagement Plans', pageViews: 1980, users: 940, avgEngagementTime: 84, percentage: 10.6 },
    { path: '/blog', title: 'Engineering Insights & Tech Articles', pageViews: 1640, users: 810, avgEngagementTime: 92, percentage: 8.7 },
    { path: '/contact', title: 'Contact & Inquiries', pageViews: 1150, users: 670, avgEngagementTime: 38, percentage: 6.1 },
    { path: '/recruitment', title: 'Careers & Open Positions', pageViews: 860, users: 490, avgEngagementTime: 42, percentage: 4.6 },
  ];

  const sources: AnalyticsSourceItem[] = [
    { source: 'google', medium: 'organic', channel: 'Google / Organic Search', users: 1940, sessions: 2780, percentage: 51.3 },
    { source: '(direct)', medium: '(none)', channel: 'Direct / None', users: 950, sessions: 1320, percentage: 24.3 },
    { source: 'linkedin.com', medium: 'referral', channel: 'LinkedIn / Social Referral', users: 480, sessions: 670, percentage: 12.4 },
    { source: 'github.com', medium: 'referral', channel: 'GitHub / Referral', users: 260, sessions: 380, percentage: 7.0 },
    { source: 'twitter.com', medium: 'referral', channel: 'X (Twitter) / Social', users: 190, sessions: 270, percentage: 5.0 },
  ];

  const devices: AnalyticsDeviceItem[] = [
    { category: 'desktop', users: 2420, sessions: 3520, percentage: 63.0 },
    { category: 'mobile', users: 1270, sessions: 1680, percentage: 33.1 },
    { category: 'tablet', users: 150, sessions: 220, percentage: 3.9 },
  ];

  const countries: AnalyticsCountryItem[] = [
    { country: 'United States', users: 1350, sessions: 1890, percentage: 35.2 },
    { country: 'India', users: 1120, sessions: 1580, percentage: 29.2 },
    { country: 'United Kingdom', users: 430, sessions: 610, percentage: 11.2 },
    { country: 'Germany', users: 310, sessions: 440, percentage: 8.1 },
    { country: 'Canada', users: 260, sessions: 370, percentage: 6.8 },
    { country: 'Australia', users: 210, sessions: 290, percentage: 5.5 },
    { country: 'Singapore', users: 160, sessions: 240, percentage: 4.0 },
  ];

  const technology: AnalyticsTechnology = {
    browsers: [
      { name: 'Chrome', users: 2530, percentage: 65.9 },
      { name: 'Safari', users: 690, percentage: 18.0 },
      { name: 'Edge', users: 380, percentage: 9.9 },
      { name: 'Firefox', users: 240, percentage: 6.2 },
    ],
    operatingSystems: [
      { name: 'Windows', users: 1720, percentage: 44.8 },
      { name: 'macOS', users: 1140, percentage: 29.7 },
      { name: 'iOS', users: 510, percentage: 13.3 },
      { name: 'Android', users: 360, percentage: 9.4 },
      { name: 'Linux', users: 110, percentage: 2.8 },
    ],
    deviceCategories: devices.map((d) => ({ name: d.category, users: d.users, percentage: d.percentage })),
  };

  const realtime: AnalyticsRealtime = {
    activeUsers: 7,
    topCountries: [
      { country: 'United States', activeUsers: 3 },
      { country: 'India', activeUsers: 2 },
      { country: 'United Kingdom', activeUsers: 1 },
      { country: 'Germany', activeUsers: 1 },
    ],
    topPages: [
      { path: '/', activeUsers: 4 },
      { path: '/services', activeUsers: 2 },
      { path: '/pricing', activeUsers: 1 },
    ],
    isDemoData: true,
  };

  return {
    overview: {
      totalUsers,
      newUsers,
      sessions,
      screenPageViews,
      engagementRate,
      eventCount,
      isDemoData: true,
    },
    timeline,
    pages,
    sources,
    devices,
    countries,
    technology,
    realtime,
  };
}

/**
 * 1. Overview KPI Metrics Report
 */
export async function getAnalyticsOverview(
  startDate = '30daysAgo',
  endDate = 'today',
  forceDemo = false
): Promise<AnalyticsOverview> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    return getDemoAnalytics({ startDate, endDate }).overview;
  }

  const cacheKey = `ga4_overview_${config.propertyId}_${startDate}_${endDate}`;

  return fetchWithCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();
      const [response] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'eventCount' },
        ],
      });

      const row = response.rows?.[0];
      const metricValues = row?.metricValues || [];

      const totalUsers = parseInt(metricValues[0]?.value || '0', 10);
      const newUsers = parseInt(metricValues[1]?.value || '0', 10);
      const sessions = parseInt(metricValues[2]?.value || '0', 10);
      const screenPageViews = parseInt(metricValues[3]?.value || '0', 10);
      const rawEngagementRate = parseFloat(metricValues[4]?.value || '0');
      const engagementRate = Math.round(rawEngagementRate * 1000) / 10; // e.g. 68.4
      const eventCount = parseInt(metricValues[5]?.value || '0', 10);

      return {
        totalUsers,
        newUsers,
        sessions,
        screenPageViews,
        engagementRate,
        eventCount,
        isDemoData: false,
      };
    } catch (error) {
      console.error('[GA4 Overview Error]: Failed to fetch overview metrics', error);
      throw new Error('Failed to retrieve analytics overview from Google Analytics.');
    }
  });
}

/**
 * 2. Users and Sessions Over Time Timeline Report
 */
export async function getAnalyticsUsersTimeline(
  startDate = '30daysAgo',
  endDate = 'today',
  forceDemo = false
): Promise<AnalyticsTimelinePoint[]> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    return getDemoAnalytics({ startDate, endDate }).timeline;
  }

  const cacheKey = `ga4_timeline_${config.propertyId}_${startDate}_${endDate}`;

  return fetchWithCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();
      const [response] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'newUsers' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      });

      if (!response.rows || response.rows.length === 0) {
        return [];
      }

      return response.rows.map((row) => {
        const rawDate = row.dimensionValues?.[0]?.value || '';
        // GA4 returns YYYYMMDD
        let formattedDate = rawDate;
        let displayDate = rawDate;

        if (rawDate.length === 8) {
          const y = rawDate.substring(0, 4);
          const m = rawDate.substring(4, 6);
          const d = rawDate.substring(6, 8);
          formattedDate = `${y}-${m}-${d}`;
          const dateObj = new Date(`${y}-${m}-${d}T00:00:00Z`);
          displayDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          });
        }

        return {
          date: formattedDate,
          displayDate,
          users: parseInt(row.metricValues?.[0]?.value || '0', 10),
          sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
          newUsers: parseInt(row.metricValues?.[2]?.value || '0', 10),
        };
      });
    } catch (error) {
      console.error('[GA4 Timeline Error]: Failed to fetch users timeline', error);
      throw new Error('Failed to retrieve timeline data from Google Analytics.');
    }
  });
}

/**
 * 3. Most Visited Pages Report
 */
export async function getAnalyticsPages(
  startDate = '30daysAgo',
  endDate = 'today',
  limit = 25,
  forceDemo = false
): Promise<{ pages: AnalyticsPageItem[]; totalViews: number }> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    const demo = getDemoAnalytics({ startDate, endDate });
    const totalViews = demo.pages.reduce((acc, p) => acc + p.pageViews, 0);
    return { pages: demo.pages.slice(0, limit), totalViews };
  }

  const cacheKey = `ga4_pages_${config.propertyId}_${startDate}_${endDate}_${limit}`;

  return fetchWithCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();
      const [response] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' },
          { name: 'userEngagementDuration' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit,
      });

      if (!response.rows || response.rows.length === 0) {
        return { pages: [], totalViews: 0 };
      }

      let totalViews = 0;
      const rawPages = response.rows.map((row) => {
        const pageViews = parseInt(row.metricValues?.[0]?.value || '0', 10);
        totalViews += pageViews;
        const users = parseInt(row.metricValues?.[1]?.value || '0', 10);
        const totalDuration = parseFloat(row.metricValues?.[2]?.value || '0');
        const avgEngagementTime = users > 0 ? Math.round(totalDuration / users) : 0;

        return {
          path: row.dimensionValues?.[0]?.value || '/',
          title: row.dimensionValues?.[1]?.value || 'Untitled',
          pageViews,
          users,
          avgEngagementTime,
          percentage: 0,
        };
      });

      const pages = rawPages.map((p) => ({
        ...p,
        percentage: totalViews > 0 ? Math.round((p.pageViews / totalViews) * 1000) / 10 : 0,
      }));

      return { pages, totalViews };
    } catch (error) {
      console.error('[GA4 Pages Error]: Failed to fetch top pages', error);
      throw new Error('Failed to retrieve page analytics from Google Analytics.');
    }
  });
}

/**
 * 4. Traffic Sources Report
 */
export async function getAnalyticsSources(
  startDate = '30daysAgo',
  endDate = 'today',
  forceDemo = false
): Promise<AnalyticsSourceItem[]> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    return getDemoAnalytics({ startDate, endDate }).sources;
  }

  const cacheKey = `ga4_sources_${config.propertyId}_${startDate}_${endDate}`;

  return fetchWithCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();
      const [response] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      });

      if (!response.rows || response.rows.length === 0) {
        return [];
      }

      let totalSessions = 0;
      const rawSources = response.rows.map((row) => {
        const source = row.dimensionValues?.[0]?.value || '(direct)';
        const medium = row.dimensionValues?.[1]?.value || '(none)';
        const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
        const sessions = parseInt(row.metricValues?.[1]?.value || '0', 10);
        totalSessions += sessions;

        return {
          source,
          medium,
          channel: `${source} / ${medium}`,
          users,
          sessions,
          percentage: 0,
        };
      });

      return rawSources.map((s) => ({
        ...s,
        percentage: totalSessions > 0 ? Math.round((s.sessions / totalSessions) * 1000) / 10 : 0,
      }));
    } catch (error) {
      console.error('[GA4 Sources Error]: Failed to fetch traffic sources', error);
      throw new Error('Failed to retrieve traffic sources from Google Analytics.');
    }
  });
}

/**
 * 5. Device Analytics Report (Desktop, Mobile, Tablet)
 */
export async function getAnalyticsDevices(
  startDate = '30daysAgo',
  endDate = 'today',
  forceDemo = false
): Promise<AnalyticsDeviceItem[]> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    return getDemoAnalytics({ startDate, endDate }).devices;
  }

  const cacheKey = `ga4_devices_${config.propertyId}_${startDate}_${endDate}`;

  return fetchWithCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();
      const [response] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      });

      if (!response.rows || response.rows.length === 0) {
        return [];
      }

      let totalUsers = 0;
      const rawDevices = response.rows.map((row) => {
        const category = (row.dimensionValues?.[0]?.value || 'desktop').toLowerCase();
        const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
        const sessions = parseInt(row.metricValues?.[1]?.value || '0', 10);
        totalUsers += users;

        return {
          category,
          users,
          sessions,
          percentage: 0,
        };
      });

      return rawDevices.map((d) => ({
        ...d,
        percentage: totalUsers > 0 ? Math.round((d.users / totalUsers) * 1000) / 10 : 0,
      }));
    } catch (error) {
      console.error('[GA4 Devices Error]: Failed to fetch device breakdown', error);
      throw new Error('Failed to retrieve device analytics from Google Analytics.');
    }
  });
}

/**
 * 6. Country Analytics Report
 */
export async function getAnalyticsCountries(
  startDate = '30daysAgo',
  endDate = 'today',
  forceDemo = false
): Promise<AnalyticsCountryItem[]> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    return getDemoAnalytics({ startDate, endDate }).countries;
  }

  const cacheKey = `ga4_countries_${config.propertyId}_${startDate}_${endDate}`;

  return fetchWithCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();
      const [response] = await client.runReport({
        property: `properties/${config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        limit: 15,
      });

      if (!response.rows || response.rows.length === 0) {
        return [];
      }

      let totalUsers = 0;
      const rawCountries = response.rows.map((row) => {
        const country = row.dimensionValues?.[0]?.value || 'Unknown';
        const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
        const sessions = parseInt(row.metricValues?.[1]?.value || '0', 10);
        totalUsers += users;

        return {
          country,
          users,
          sessions,
          percentage: 0,
        };
      });

      return rawCountries.map((c) => ({
        ...c,
        percentage: totalUsers > 0 ? Math.round((c.users / totalUsers) * 1000) / 10 : 0,
      }));
    } catch (error) {
      console.error('[GA4 Countries Error]: Failed to fetch country breakdown', error);
      throw new Error('Failed to retrieve country analytics from Google Analytics.');
    }
  });
}

/**
 * 7. Browser & Technology Report
 */
export async function getAnalyticsTechnology(
  startDate = '30daysAgo',
  endDate = 'today',
  forceDemo = false
): Promise<AnalyticsTechnology> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    return getDemoAnalytics({ startDate, endDate }).technology;
  }

  const cacheKey = `ga4_technology_${config.propertyId}_${startDate}_${endDate}`;

  return fetchWithCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();

      const [[browserRes], [osRes], [deviceRes]] = await Promise.all([
        client.runReport({
          property: `properties/${config.propertyId}`,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'browser' }],
          metrics: [{ name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
          limit: 8,
        }),
        client.runReport({
          property: `properties/${config.propertyId}`,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'operatingSystem' }],
          metrics: [{ name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
          limit: 8,
        }),
        client.runReport({
          property: `properties/${config.propertyId}`,
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        }),
      ]);

      const formatItems = (rows?: { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null }[] | null) => {
        if (!rows || rows.length === 0) return [];
        let total = 0;
        const items = rows.map((r) => {
          const name = r.dimensionValues?.[0]?.value || 'Other';
          const users = parseInt(r.metricValues?.[0]?.value || '0', 10);
          total += users;
          return { name, users, percentage: 0 };
        });
        return items.map((i) => ({
          ...i,
          percentage: total > 0 ? Math.round((i.users / total) * 1000) / 10 : 0,
        }));
      };

      return {
        browsers: formatItems(browserRes.rows),
        operatingSystems: formatItems(osRes.rows),
        deviceCategories: formatItems(deviceRes.rows),
      };
    } catch (error) {
      console.error('[GA4 Technology Error]: Failed to fetch technology breakdown', error);
      throw new Error('Failed to retrieve technology analytics from Google Analytics.');
    }
  });
}

/**
 * 8. Real-Time Active Users Report
 */
export async function getAnalyticsRealtime(forceDemo = false): Promise<AnalyticsRealtime> {
  const config = isGoogleAnalyticsConfigured();
  if (!config.configured || forceDemo) {
    return getDemoAnalytics({ startDate: '30daysAgo', endDate: 'today' }).realtime;
  }

  const cacheKey = `ga4_realtime_${config.propertyId}`;

  return fetchWithCache(cacheKey, REALTIME_CACHE_TTL_MS, async () => {
    try {
      const client = getAnalyticsClient();

      const [[response], [countryRes], [pageRes]] = await Promise.all([
        client.runRealtimeReport({
          property: `properties/${config.propertyId}`,
          metrics: [{ name: 'activeUsers' }],
        }),
        client.runRealtimeReport({
          property: `properties/${config.propertyId}`,
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 5,
        }),
        client.runRealtimeReport({
          property: `properties/${config.propertyId}`,
          dimensions: [{ name: 'unifiedScreenName' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 5,
        }),
      ]);

      const activeUsers = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0', 10);

      const topCountries = (countryRes.rows || []).map((row) => ({
        country: row.dimensionValues?.[0]?.value || 'Unknown',
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
      }));

      const topPages = (pageRes.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
      }));

      return {
        activeUsers,
        topCountries,
        topPages,
        isDemoData: false,
      };
    } catch (error) {
      console.warn('[GA4 Realtime Warning]: Real-time report issue, returning 0 active users', error);
      return {
        activeUsers: 0,
        topCountries: [],
        topPages: [],
        isDemoData: false,
      };
    }
  });
}
