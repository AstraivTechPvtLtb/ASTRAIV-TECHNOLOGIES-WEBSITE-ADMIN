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
  isFallback?: boolean;
  telemetryUnavailable?: boolean;
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
  isFallback?: boolean;
  telemetryUnavailable?: boolean;
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

export interface ParsedServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id?: string;
  type?: string;
}

export interface CredentialResolutionResult {
  credentials: ParsedServiceAccountCredentials | null;
  status: 'valid' | 'missing' | 'malformed_base64' | 'invalid_json' | 'missing_fields';
  errorMessage?: string;
}

/**
 * Safely parses and validates Google Service Account credentials strictly from
 * the GOOGLE_SERVICE_ACCOUNT_KEY environment variable.
 * Supports Base64-encoded JSON strings, raw JSON objects, handles surrounding quotes,
 * internal whitespace/newlines, and strips UTF-8 BOM.
 * Never throws and never logs sensitive private key material.
 */
export function resolveServiceAccountCredentials(rawInput?: string): CredentialResolutionResult {
  const envVal = rawInput !== undefined ? rawInput : process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!envVal || typeof envVal !== 'string' || envVal.trim() === '') {
    return {
      credentials: null,
      status: 'missing',
      errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY is not defined in environment',
    };
  }

  let clean = envVal.trim();

  // Strip enclosing quotes if present (e.g. from .env file quote wrappers)
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }

  if (!clean) {
    return {
      credentials: null,
      status: 'missing',
      errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY is empty',
    };
  }

  let jsonStr = '';

  if (clean.startsWith('{')) {
    // Raw JSON string
    jsonStr = clean;
  } else {
    // Base64 encoded string - strip any interior whitespace/newlines
    const sanitizedBase64 = clean.replace(/\s+/g, '');

    // Validate that the string contains only valid Base64 characters
    if (!/^[A-Za-z0-9+/=_-]+$/.test(sanitizedBase64)) {
      return {
        credentials: null,
        status: 'malformed_base64',
        errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY contains invalid Base64 characters',
      };
    }

    try {
      jsonStr = Buffer.from(sanitizedBase64, 'base64').toString('utf8');
    } catch {
      return {
        credentials: null,
        status: 'malformed_base64',
        errorMessage: 'Failed to decode Base64 in GOOGLE_SERVICE_ACCOUNT_KEY',
      };
    }

    // Strip UTF-8 Byte Order Mark (BOM) if present
    if (jsonStr.charCodeAt(0) === 0xfeff) {
      jsonStr = jsonStr.slice(1);
    }
    jsonStr = jsonStr.trim();

    if (!jsonStr.startsWith('{')) {
      return {
        credentials: null,
        status: 'invalid_json',
        errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY Base64 payload does not evaluate to a valid JSON object',
      };
    }
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      credentials: null,
      status: 'invalid_json',
      errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY contains invalid JSON',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      credentials: null,
      status: 'invalid_json',
      errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY JSON must be an object',
    };
  }

  const client_email = typeof parsed.client_email === 'string' ? parsed.client_email.trim() : '';
  const rawPrivateKey = typeof parsed.private_key === 'string' ? parsed.private_key.trim() : '';
  const project_id = typeof parsed.project_id === 'string' ? parsed.project_id.trim() : undefined;
  const type = typeof parsed.type === 'string' ? parsed.type.trim() : undefined;

  if (!client_email || !client_email.includes('@')) {
    return {
      credentials: null,
      status: 'missing_fields',
      errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY is missing a valid client_email field',
    };
  }

  if (!rawPrivateKey || !rawPrivateKey.includes('PRIVATE KEY') || !rawPrivateKey.includes('-----')) {
    return {
      credentials: null,
      status: 'missing_fields',
      errorMessage: 'GOOGLE_SERVICE_ACCOUNT_KEY is missing a valid private_key PEM structure',
    };
  }

  return {
    credentials: {
      client_email,
      private_key: rawPrivateKey.replace(/\\n/g, '\n'),
      project_id,
      type,
    },
    status: 'valid',
  };
}

interface AuthFailureState {
  hasFailed: boolean;
  message: string;
  failedAt: number;
  fingerprint: string;
}

let authFailureState: AuthFailureState | null = null;
const AUTH_FAILURE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown before re-attempting Google API
let lastCredsFingerprint = '';

export function isAuthError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as Error)?.message || String(err);
  const code = (err as { code?: number })?.code;
  return (
    code === 16 ||
    msg.includes('UNAUTHENTICATED') ||
    msg.includes('invalid_grant') ||
    msg.includes('Invalid JWT Signature') ||
    msg.includes('invalid authentication credentials')
  );
}

export function isPermissionError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as Error)?.message || String(err);
  const code = (err as { code?: number })?.code;
  return (
    code === 7 ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('not have sufficient permissions') ||
    msg.includes('does not have permission')
  );
}

function handleTelemetryError(reportName: string, error: unknown, fingerprint?: string) {
  const currentFp = fingerprint || lastCredsFingerprint;
  if (isAuthError(error)) {
    if (!authFailureState || authFailureState.fingerprint !== currentFp || Date.now() - authFailureState.failedAt > AUTH_FAILURE_COOLDOWN_MS) {
      console.warn(
        `[GA4 Telemetry Notice]: Google Analytics service account key was rejected (UNAUTHENTICATED). Telemetry is gracefully operating in fallback mode. Update GOOGLE_SERVICE_ACCOUNT_KEY with an active key from Google Cloud Console.`
      );
      authFailureState = {
        hasFailed: true,
        message: 'Google Service Account credentials invalid or revoked (UNAUTHENTICATED)',
        failedAt: Date.now(),
        fingerprint: currentFp,
      };
    }
  } else if (isPermissionError(error)) {
    if (!authFailureState || authFailureState.fingerprint !== currentFp || Date.now() - authFailureState.failedAt > AUTH_FAILURE_COOLDOWN_MS) {
      console.warn(
        `[GA4 Telemetry Notice]: Google Analytics permission denied (PERMISSION_DENIED). Ensure the service account has Viewer access in GA4 Property Access Management.`
      );
      authFailureState = {
        hasFailed: true,
        message: 'Service account lacks Viewer permission on GA4 Property. Add it in GA4 Property Access Management.',
        failedAt: Date.now(),
        fingerprint: currentFp,
      };
    }
  } else {
    console.warn(`[GA4 ${reportName} Warning]:`, (error as Error)?.message || error);
  }
}

/**
 * Resets memory cache, pending requests, and circuit-breaker cooldowns.
 * Useful for development server reloads and unit testing.
 */
export function resetAnalyticsState(): void {
  clientInstance = null;
  authFailureState = null;
  lastCredsFingerprint = '';
  memoryCache.clear();
  pendingRequests.clear();
}

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

  const credRes = resolveServiceAccountCredentials();
  const currentFingerprint = credRes.credentials
    ? `${credRes.credentials.client_email}:${propertyId}`
    : `unconfigured:${propertyId}`;

  // If credentials or property ID changed, immediately clear any prior failure cooldown
  if (authFailureState && authFailureState.fingerprint !== currentFingerprint) {
    authFailureState = null;
    clientInstance = null;
    lastCredsFingerprint = currentFingerprint;
  }

  // If credentials are not valid, report the exact reason
  if (!credRes.credentials) {
    return {
      configured: false,
      propertyId: propertyId || DEFAULT_GA_PROPERTY_ID,
      reason: credRes.errorMessage || 'Google Service Account credentials not configured in environment',
    };
  }

  // If in active auth failure cooldown for this specific credential
  if (authFailureState?.hasFailed) {
    if (Date.now() - authFailureState.failedAt < AUTH_FAILURE_COOLDOWN_MS) {
      return {
        configured: false,
        propertyId: propertyId || DEFAULT_GA_PROPERTY_ID,
        reason: authFailureState.message,
      };
    } else {
      // Cooldown expired, allow retry on next query
      authFailureState = null;
    }
  }

  return {
    configured: true,
    propertyId: propertyId || DEFAULT_GA_PROPERTY_ID,
    reason: undefined,
  };
}

/**
 * Instantiates the BetaAnalyticsDataClient with explicit credentials.
 * Throws an explicit error if credentials are not configured.
 * Never falls back to implicit Application Default Credentials (ADC).
 */
let clientInstance: BetaAnalyticsDataClient | null = null;

function getAnalyticsClient(): BetaAnalyticsDataClient {
  const credRes = resolveServiceAccountCredentials();
  if (!credRes.credentials) {
    throw new Error(credRes.errorMessage || 'Google Service Account credentials not configured in environment');
  }

  const creds = credRes.credentials;
  const propertyId = (process.env.GA_PROPERTY_ID || DEFAULT_GA_PROPERTY_ID).replace(/^["']|["']$/g, '').replace(/^properties\//, '').trim();
  const currentFingerprint = `${creds.client_email}:${propertyId}`;

  if (currentFingerprint && currentFingerprint !== lastCredsFingerprint) {
    clientInstance = null;
    authFailureState = null;
    lastCredsFingerprint = currentFingerprint;
  }

  if (clientInstance) {
    return clientInstance;
  }

  clientInstance = new BetaAnalyticsDataClient({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    projectId: creds.project_id || 'spartan-theorem-509103-a3',
  });

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
function getDemoAnalytics(_range?: { startDate: string; endDate: string }) {
  const realtime: AnalyticsRealtime = {
    activeUsers: 0,
    topCountries: [],
    topPages: [],
    isDemoData: true,
    isFallback: true,
    telemetryUnavailable: true,
  };

  return {
    overview: {
      totalUsers: 0,
      newUsers: 0,
      sessions: 0,
      screenPageViews: 0,
      engagementRate: 0,
      eventCount: 0,
      isDemoData: true,
      isFallback: true,
      telemetryUnavailable: true,
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
      handleTelemetryError('Overview', error);
      return {
        totalUsers: 0,
        newUsers: 0,
        sessions: 0,
        screenPageViews: 0,
        engagementRate: 0,
        eventCount: 0,
        isDemoData: true,
        isFallback: true,
        telemetryUnavailable: true,
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
      handleTelemetryError('Timeline', error);
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
      handleTelemetryError('Pages', error);
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
      handleTelemetryError('Sources', error);
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
      handleTelemetryError('Devices', error);
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
      handleTelemetryError('Countries', error);
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
      handleTelemetryError('Technology', error);
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
      handleTelemetryError('Realtime', error);
      return {
        activeUsers: 0,
        topCountries: [],
        topPages: [],
        isDemoData: true,
        isFallback: true,
        telemetryUnavailable: true,
      };
    }
  });
}

/**
 * Helper to determine if telemetry data is in fallback/offline mode.
 */
export function isTelemetryFallback(
  overview?: AnalyticsOverview | AnalyticsRealtime | null
): boolean {
  if (!overview) return true;
  return Boolean(overview.isDemoData || overview.isFallback || overview.telemetryUnavailable);
}

