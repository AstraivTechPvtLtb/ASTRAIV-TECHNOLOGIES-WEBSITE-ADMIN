/**
 * @file admin/src/lib/storage/supabase-provider.ts
 * @description [STORAGE] Supabase Storage adapter fallback for candidate resumes.
 */

import { createClient } from '@/models/supabase';
import {
  StorageProvider,
  StorageProviderType,
  UploadSessionRequest,
  UploadSessionResponse,
  VerifyObjectResult,
  DownloadUrlResult,
} from './types';
import { sanitizeFilename, validateDocumentBuffer } from './validator';
import { generateUploadSessionToken, verifyUploadSessionToken } from './token';
import crypto from 'crypto';

const STAGING_KEY_PATTERN = /^staging\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{32}\.(pdf|docx)$/i;
const FINAL_KEY_PATTERN = /^resumes\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{32}\.(pdf|docx)$/i;

export class SupabaseStorageProvider implements StorageProvider {
  readonly providerName: StorageProviderType = 'supabase';
  private bucket: string;

  constructor() {
    this.bucket = process.env.SUPABASE_RESUME_BUCKET || 'candidate-resumes';
  }

  static isConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );
  }

  async createUploadSession(req: UploadSessionRequest): Promise<UploadSessionResponse> {
    const cleanName = sanitizeFilename(req.filename);
    const datePrefix = new Date().toISOString().split('T')[0];
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext = (cleanName.split('.').pop() || 'pdf').toLowerCase();

    if (ext !== 'pdf' && ext !== 'docx') {
      throw new Error('Unsupported file extension. Only PDF and DOCX files are permitted.');
    }

    const stagingKey = `staging/${datePrefix}/${randomHex}.${ext}`;
    const finalKey = `resumes/${datePrefix}/${randomHex}.${ext}`;
    const { sessionToken, expiresAt } = generateUploadSessionToken(stagingKey, finalKey, 900);

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(stagingKey);

    if (error || !data) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `[SUPABASE_STORAGE_ERROR] Failed to create signed upload URL: ${error?.message || 'Bucket not found or permission denied'}`
        );
      }
      return {
        provider: 'supabase',
        uploadUrl: `/api/applications/upload-direct?key=${encodeURIComponent(stagingKey)}&token=${encodeURIComponent(sessionToken)}`,
        stagingKey,
        finalKey,
        sessionToken,
        expiresAt,
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
    // 1. Strict key pattern and prefix restrictions
    if (!STAGING_KEY_PATTERN.test(params.stagingKey)) {
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: 'Invalid staging key format or disallowed prefix.',
      };
    }
    if (!FINAL_KEY_PATTERN.test(params.finalKey)) {
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: 'Invalid destination key format or disallowed prefix.',
      };
    }

    const stagingSuffix = params.stagingKey.replace(/^staging\//, '');
    const finalSuffix = params.finalKey.replace(/^resumes\//, '');
    if (stagingSuffix.toLowerCase() !== finalSuffix.toLowerCase()) {
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: 'Mismatched staging and destination object keys.',
      };
    }

    // 2. Validate cryptographic upload session token
    const tokenCheck = verifyUploadSessionToken(params.stagingKey, params.finalKey, params.sessionToken);
    if (!tokenCheck.valid) {
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: tokenCheck.error || 'Invalid upload session token.',
      };
    }

    try {
      const supabase = await createClient();

      // 3. Replay protection: verify destination object does NOT already exist
      const destCheck = await supabase.storage.from(this.bucket).download(params.finalKey);
      if (destCheck.data) {
        await supabase.storage.from(this.bucket).remove([params.stagingKey]).catch(() => {});
        return {
          verified: false,
          actualSizeBytes: 0,
          verifiedMime: '',
          error: 'Destination resume object already exists. Replay or overwrite is prohibited.',
        };
      }

      // 4. Download and verify entire staging document
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

      if (buffer.length === 0) {
        await supabase.storage.from(this.bucket).remove([params.stagingKey]).catch(() => {});
        return { verified: false, actualSizeBytes: 0, verifiedMime: '', error: 'Uploaded object is empty.' };
      }
      if (buffer.length > 10 * 1024 * 1024) {
        await supabase.storage.from(this.bucket).remove([params.stagingKey]).catch(() => {});
        return { verified: false, actualSizeBytes: buffer.length, verifiedMime: '', error: 'Uploaded file exceeds 10MB limit.' };
      }

      const valResult = validateDocumentBuffer(buffer, params.stagingKey);

      if (!valResult.isValid) {
        await supabase.storage.from(this.bucket).remove([params.stagingKey]).catch(() => {});
        return {
          verified: false,
          actualSizeBytes: buffer.length,
          verifiedMime: valResult.mimeType,
          error: valResult.error || 'Document signature verification failed.',
        };
      }

      // 5. Promote to final key
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
    const cleanFilename = sanitizeFilename(params.filename);
    const expiresIn = params.expiresInSeconds || 300;
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(params.key, expiresIn, {
        download: cleanFilename,
      });

    if (error || !data) {
      throw new Error(`Failed to generate signed download URL: ${error?.message || 'Key not found'}`);
    }

    return {
      downloadUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async saveBuffer(key: string, buffer: Buffer, mimeType: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { error } = await supabase.storage.from(this.bucket).upload(key, buffer, {
        contentType: mimeType,
        upsert: true,
      });
      return !error;
    } catch {
      return false;
    }
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
