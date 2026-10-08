/**
 * @file admin/src/lib/storage/index.ts
 * @description [STORAGE] Storage provider factory resolving Cloudflare R2 Standard, Supabase Storage, or Local Provider.
 */

import { StorageProvider } from './types';
import { CloudflareR2StorageProvider } from './r2-provider';
import { SupabaseStorageProvider } from './supabase-provider';
import { LocalStorageProvider } from './local-provider';

export * from './types';
export * from './validator';
export * from './r2-provider';
export * from './supabase-provider';
export * from './local-provider';

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  if (CloudflareR2StorageProvider.isConfigured()) {
    cachedProvider = new CloudflareR2StorageProvider();
    return cachedProvider;
  }

  if (SupabaseStorageProvider.isConfigured()) {
    cachedProvider = new SupabaseStorageProvider();
    return cachedProvider;
  }

  cachedProvider = new LocalStorageProvider();
  return cachedProvider;
}
