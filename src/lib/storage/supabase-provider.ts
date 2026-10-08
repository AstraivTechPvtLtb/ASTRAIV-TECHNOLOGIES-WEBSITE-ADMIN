/**
 * @file admin/src/lib/storage/supabase-provider.ts
 * @description [STORAGE] Supabase Storage fallback adapter for candidate resumes.
 */

import { isSupabaseConfigured, createClient } from '@/models/supabase';
import {
  StorageProvider,
  StorageProviderType,
  UploadSessionRequest,
  UploadSessionResponse,
  VerifyObjectResult,
  DownloadUrlResult,
} from './types';
import { sanitizeFilename, validateDocumentBuffer } from './validator';
import crypto from 'crypto';

export class SupabaseStorageProvider implements StorageProvider {
  readonly providerName: StorageProviderType = 'supabase';
  private bucket = 'resumes';

  static isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  async createUploadSession(req: UploadSessionRequest): Promise<UploadSessionResponse> {
    const cleanName = sanitizeFilename(req.filename);
    const datePrefix = new Date().toISOString().split('T')[0];
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext = cleanName.split('.').pop() || 'pdf';

    const stagingKey = `staging/${datePrefix}/${randomHex}.${ext}`;
    const finalKey = `resumes/${datePrefix}/${randomHex}.${ext}`;
    const sessionToken = crypto.randomBytes(24).toString('hex');

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(stagingKey);

    if (error || !data) {
      return {
        provider: 'supabase',
        uploadUrl: `/api/applications/upload-direct?key=${encodeURIComponent(stagingKey)}&token=${sessionToken}`,
        stagingKey,
        finalKey,
        sessionToken,
        expiresAt: new Date(Date.now() + 900 * 1000).toISOString(),
      };
    }

    return {
      provider: 'supabase',
      uploadUrl: data.signedUrl,
      stagingKey,
      finalKey,
      sessionToken,
      expiresAt: new Date(Date.now() + 900 * 1000).toISOString(),
    };
  }

  async verifyAndPromoteObject(params: {
    stagingKey: string;
    finalKey: string;
    expectedMime: string;
    sessionToken: string;
  }): Promise<VerifyObjectResult> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.storage.from(this.bucket).download(params.stagingKey);

      if (error || !data) {
        return {
          verified: false,
          actualSizeBytes: 0,
          verifiedMime: '',
          error: error?.message || 'Could not locate uploaded staging resume in Supabase storage.',
        };
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const valResult = validateDocumentBuffer(buffer, params.stagingKey);

      if (!valResult.isValid) {
        await supabase.storage.from(this.bucket).remove([params.stagingKey]);
        return {
          verified: false,
          actualSizeBytes: buffer.length,
          verifiedMime: valResult.mimeType,
          error: valResult.error || 'Document signature verification failed.',
        };
      }

      await supabase.storage.from(this.bucket).move(params.stagingKey, params.finalKey);

      return {
        verified: true,
        actualSizeBytes: buffer.length,
        verifiedMime: valResult.mimeType,
      };
    } catch (err) {
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: (err as Error)?.message || 'Failed to verify upload in Supabase storage.',
      };
    }
  }

  async getSecureDownloadUrl(params: {
    key: string;
    filename: string;
    mimeType: string;
    expiresInSeconds?: number;
  }): Promise<DownloadUrlResult> {
    const supabase = await createClient();
    const expiresIn = params.expiresInSeconds || 300;
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(params.key, expiresIn, {
        download: sanitizeFilename(params.filename),
      });

    if (error || !data) {
      throw new Error(`Failed to generate signed download URL: ${error?.message || 'Unknown error'}`);
    }

    return {
      downloadUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { error } = await supabase.storage.from(this.bucket).remove([key]);
      return !error;
    } catch {
      return false;
    }
  }
}
