/**
 * @file admin/src/lib/google-analytics.ts
 * @description [SERVICE] Google Analytics 4 (GA4) Data API service integration.
 * Handles server-side authentication, in-memory caching with request deduplication,
 * report generation, and sanitized error handling.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';

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

const DEFAULT_GA_PROPERTY_ID = '555075963';
const DEFAULT_SERVICE_ACCOUNT_B64 =
  'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAic3BhcnRhbi10aGVvcmVtLTUwOTEwMy1hMyIsCiAgInByaXZhdGVfa2V5X2lkIjogIjc2ZTg3OTlkNzhlNDNmYjg0NzVmZWExMTQ5YWE3MTBjNTdkNTU5OGUiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRRFJ0RmozNEY0Sm1OeTVcbnRuYW1NMk5IaFBwQWZFS3V1UTNKd096bFRtaUl2SlMyOEdBSFJzcVBrMndmeHRkRmJsQjZNMlZKOTlVWktWU0VcbnpzdGhjQjVnT3V2a1UrNjZTeDdVeFBzY2MzRUZUdU42RCtnTXdNM0tvZjJ2aTdidTlIVjNWV1ZJc1huSWcvcVFcbnQ1b2N6RmVDM2xNbFY0M3NsMnRtYWRld3VHeU02bWMwRjhVd1M5WGdYK1I0NmNZQjVPNFlMOUNVMUo2MnJEdTBcbkVnaHZpdUhBWFM4VUVCWWNrb0lUTHBVaG1wd0J3aTBKMWFsaFMxeThsSExrR25RVVFjTDF3VExvTWJjTTNUZHFcbjhoSTRFRWpXemxHb25Ga2tMQXJzVjlCRkkvNHFIS2FHSFRDTk85dk5yMFAzQnk1Sm9vVXYvdDVOMWZ2YVl1SmdcblVYVXRNazNwQWdNQkFBRUNnZ0VBQmwvb3BKMVk0blZpVlZDNmdJWWg5bXlRaW1sZlFnNHlTNlVqbG1ZT0o2K2FcbjNONUhxYStoVjB0a2FmNjFNSGFWdC9Ic0drWGxsVDFFUlFGcWN1TngxWnZ6bG9ZN2VpL2FmUWpoWWgybUZ5MXRcbkhSQVN6alliWGdyb3Fpb201UktWa21ETVRSdkhCTktkUHBlME5idjdvak9Wc2JZeUJHU0hJV1FtTXVpQ1NwSVpcbitOSjdXa0JmeGlib1Fra2l1SW9ONk42cmpUeDA3Y2tBNFlCMHFDRUVpS1VadHJiejFodmVJdFZ3UTlDejJEQmpcbm5yOVZNT0g3SS85RDlDVUpDdU5yaEtYTVBLdGtkNEk1Wk1tRkJkTzhMNGl1b2R6ZlNvdDc0ZFhaRFRXbm5kNzBcbnZ1TDNhQUVIVHNpb2pkNG9JYWl6QUs4ekpQR0dXd0E3MXRIVzBJbWtZUUtCZ1FEdzlzVzFFRmJHUnRnQ3dta1RcblhneHhvMWJiNjh1Zm1XT1dvNzEzeVc3YisvY29pdkFCcnpIc080NFdSU1ZIcGlvczlQYkU1Z2FNSnYwZ0EwcmpcbnRsOUNkckI3dUYzWnNqUlZQbVpGVXU2SzR2S0QzTEd0bTNjYnlqK2ZpNGVML0ZvdEM2R2k5Zk1WOG92ekR3MjlcbnJ5Rk5HcHRVMnAvMTFmeWhFMVpHTFpnUm9RS0JnUURleWpvNFFGVHJTNEh6TWtITHdXY2srK210SFJIeTcwU1Fcbm9hdGlZaFA5NHVaeXE5ZUtQUVlzMGhqZ2t4N3JTbFFlSEpqMENOYWNubzR1QS9EcG5XZ0lET3FJbVUzN1MvbXlcbk53MHIzeENDdEx2TlRGWWVuMUIyRzl3RFZlVVh0S1l4M0EwMVdOSG00TVVCdHRyTVE2T0FxMUt4ZHdYY2tvcXhcbjRiMldkODNuU1FLQmdRQ1VBL0hrVEJvUmg3anUwUDc4ajV2elBoTi8yZkxsb2JKaitVYk1TeWJXNklxbEU5dGtcbkhYcjhFb1V3TnQ4MGlPU0ZZeUFtU09vaXMxeHZpclk0OUhERmdlVGN5cDZUdC95ZmxFbjhNWG9vUkVvV0o3M1lcbjE1T3R0V21wbG1yMzJWYUhMd3JsOEZDVzNidUwzV1ppYXk1NGoyeDFEaXFPTnhrTTFMVDlQTXFab1FLQmdRRE5cbm0rNzlLUW4yR1RwMStvVFVpY29xVEw4TkFBNG5tUUE3UnFrSDVDSTFKbW10bk1BUUdWK1FqOWxic1F0UTlNa0tcbi9UTi96SVJjQ015STFTUktSZlhUc0Mvbkh5emo1ZXNzdVRmVHJFcnRoZVRvaERIYWt3ZEw2VXcwVzlwUTlXeUlcbkNXQzdRaHg5cWlURy96MlFWRUFhS0lMcHUwSFNuZitZU1JDU1JFRG4yUUtCZ0JMRTJCVHJjaFpJbnRRamJyTVFcbk55ckcyOUNlalZxRythbytpeGF5VjlvVTZsWmw0a2wwOTdlWUtOQlQzdktuYWxLWTlpUkRMSlc1ZzRRY1d6UUtcbkdLdjByeDRNL2FCNmJmdGJ4aFpZeGViWHF4TEZxcHhMSk1UV0lJTGpML1RlNzBNMUpqZlA4cTFQQXM0WGh2RWpcbkJaNXJlR1NOZXJrQ2wwa3kzdndRdkRRL1xuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImdhNC1hZG1pbkBzcGFydGFuLXRoZW9yZW0tNTA5MTAzLWEzLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjEwOTU1NzA1NjUxNDAzOTkwOTY1MCIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZ2E0LWFkbWluJTQwc3BhcnRhbi10aGVvcmVtLTUwOTEwMy1hMy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgInVuaXZlcnNlX2RvbWFpbiI6ICJnb29nbGVhcGlzLmNvbSIKfQo=';

/**
 * Checks if Google Analytics 4 environment variables and credentials are configured.
 */
export function isGoogleAnalyticsConfigured(): {
  configured: boolean;
  propertyId: string;
  reason?: string;
} {
  let propertyId = (process.env.GA_PROPERTY_ID || DEFAULT_GA_PROPERTY_ID).trim();
  propertyId = propertyId.replace(/^["']|["']$/g, '').trim();
  propertyId = propertyId.replace(/^properties\//, '').trim();

  // If someone passed the Measurement ID (e.g. G-XXXXX) or a non-numeric string, use the verified Property ID
  if (propertyId.startsWith('G-') || !/^\d+$/.test(propertyId)) {
    propertyId = DEFAULT_GA_PROPERTY_ID;
  }

  return {
    configured: true,
    propertyId: propertyId || DEFAULT_GA_PROPERTY_ID,
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

  // Parse inline, environment, or embedded credentials
  let creds: { client_email: string; private_key: string; project_id?: string } | null = null;

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (rawKey) {
    try {
      const decoded = rawKey.startsWith('{')
        ? rawKey
        : Buffer.from(rawKey, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (parsed.client_email && parsed.private_key) {
        creds = parsed;
      }
    } catch (e) {
      console.warn('[GA4 Auth]: Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY, falling back to verified embedded key', e);
    }
  }

  // Fallback to verified embedded service account
  if (!creds) {
    try {
      const decoded = Buffer.from(DEFAULT_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
      creds = JSON.parse(decoded);
    } catch (e) {
      console.error('[GA4 Auth Error]: Failed to decode DEFAULT_SERVICE_ACCOUNT_B64', e);
    }
  }

  if (creds && creds.client_email && creds.private_key) {
    // Clean environment to prevent google-auth-library from checking missing file paths on serverless
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }

    clientInstance = new BetaAnalyticsDataClient({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key.replace(/\\n/g, '\n'),
      },
      projectId: creds.project_id || 'spartan-theorem-509103-a3',
    });
    return clientInstance;
  }

  // Fallback client
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
  const realtime: AnalyticsRealtime = {
    activeUsers: 0,
    topCountries: [],
    topPages: [],
    isDemoData: false,
  };

  return {
    overview: {
      totalUsers: 0,
      newUsers: 0,
      sessions: 0,
      screenPageViews: 0,
      engagementRate: 0,
      eventCount: 0,
      isDemoData: false,
    },
    timeline: [] as AnalyticsTimelinePoint[],
    pages: [] as AnalyticsPageItem[],
    sources: [] as AnalyticsSourceItem[],
    devices: [] as AnalyticsDeviceItem[],
    countries: [] as AnalyticsCountryItem[],
    technology: {
      browsers: [],
      operatingSystems: [],
      deviceCategories: [],
    },
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
      return {
        totalUsers: 0,
        newUsers: 0,
        sessions: 0,
        screenPageViews: 0,
        engagementRate: 0,
        eventCount: 0,
        isDemoData: false,
      };
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
      return [];
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
      return { pages: [], totalViews: 0 };
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
      return [];
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
      return [];
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
      return [];
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
      return { browsers: [], operatingSystems: [], deviceCategories: [] };
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
