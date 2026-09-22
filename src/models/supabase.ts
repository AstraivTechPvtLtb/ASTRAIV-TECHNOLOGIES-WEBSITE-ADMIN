/**
 * @file admin/src/models/supabase.ts
 * @description [MODEL] Supabase client utility for live deployment fallback.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Validates whether a key looks like a plausible Supabase API key.
 * Supports legacy JWTs ('ey...'), new publishable keys ('sb_publishable_...'),
 * secret keys ('sb_secret_...'), or custom tokens (>20 chars).
 */
export function isValidSupabaseKey(key?: string): boolean {
  const cleaned = cleanEnv(key);
  if (!cleaned || cleaned.length < 20) return false;
  if (
    cleaned.includes('placeholder') ||
    cleaned.includes('your_anon') ||
    cleaned.includes('your_service') ||
    cleaned === 'your_anon_key' ||
    cleaned.startsWith('your_')
  ) {
    return false;
  }
  return true;
}

export function getSupabaseUrl(): string {
  const url =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    cleanEnv(process.env.SUPABASE_URL) ||
    'https://cvdiedebmguahkmzkwtd.supabase.co';
  return url;
}

export function getSupabaseKey(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  ];

  for (const c of candidates) {
    const cleaned = cleanEnv(c);
    if (isValidSupabaseKey(cleaned)) {
      return cleaned;
    }
  }

  return '';
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  const hasValidUrl = Boolean(url && url.startsWith('https://') && !url.includes('placeholder'));
  return hasValidUrl && Boolean(key);
}

export async function createClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();
  return createSupabaseClient(supabaseUrl, supabaseKey);
}
