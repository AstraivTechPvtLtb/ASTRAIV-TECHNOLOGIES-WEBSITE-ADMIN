/**
 * @file admin/src/models/supabase.ts
 * @description [MODEL] Supabase client utility for live deployment fallback.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function isValidSupabaseJwt(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 50) return false;
  if (!trimmed.startsWith('ey')) return false;
  const parts = trimmed.split('.');
  if (parts.length !== 3) return false;
  if (trimmed.includes('placeholder') || trimmed.includes('your_')) return false;
  return true;
}

export function isSupabaseConfigured(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  const hasValidUrl = Boolean(url && url.startsWith('https://') && !url.includes('placeholder'));
  const hasValidKey = isValidSupabaseJwt(anonKey) || isValidSupabaseJwt(serviceKey);

  return hasValidUrl && hasValidKey;
}

export async function createClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  // For public client authentication (OTP dispatch & verification), the anon key is required
  const supabaseKey = isValidSupabaseJwt(anonKey)
    ? anonKey
    : isValidSupabaseJwt(serviceKey)
    ? serviceKey
    : (anonKey || serviceKey || '');

  return createSupabaseClient(supabaseUrl, supabaseKey);
}
