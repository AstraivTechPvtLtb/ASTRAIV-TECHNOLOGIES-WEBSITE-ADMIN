/**
 * @file admin/src/lib/storage/local-provider.ts
 * @description [STORAGE] Safe local storage provider for development, tests, and air-gapped environments.
 */

import fs from 'fs';
import path from 'path';
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

export class LocalStorageProvider implements StorageProvider {
  readonly providerName: StorageProviderType = 'local';
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), '.data', 'resumes');
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch {
        // Ignored
      }
    }
  }

  async createUploadSession(req: UploadSessionRequest): Promise<UploadSessionResponse> {
    const cleanName = sanitizeFilename(req.filename);
    const datePrefix = new Date().toISOString().split('T')[0];
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext = cleanName.split('.').pop() || 'pdf';

    const stagingKey = `staging/${datePrefix}/${randomHex}.${ext}`;
    const finalKey = `resumes/${datePrefix}/${randomHex}.${ext}`;
    const sessionToken = crypto.randomBytes(24).toString('hex');

    return {
      provider: 'local',
      uploadUrl: `/api/applications/upload-direct?key=${encodeURIComponent(stagingKey)}&token=${sessionToken}`,
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
    const stagingPath = path.join(this.baseDir, params.stagingKey);
    const finalPath = path.join(this.baseDir, params.finalKey);

    if (!fs.existsSync(stagingPath)) {
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: 'Staging object not found on local disk.',
      };
    }

    try {
      const buffer = fs.readFileSync(stagingPath);
      const valResult = validateDocumentBuffer(buffer, params.stagingKey);

      if (!valResult.isValid) {
        fs.unlinkSync(stagingPath);
        return {
          verified: false,
          actualSizeBytes: buffer.length,
          verifiedMime: valResult.mimeType,
          error: valResult.error || 'Document signature validation failed.',
        };
      }

      const finalDir = path.dirname(finalPath);
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
      }

      fs.renameSync(stagingPath, finalPath);

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
        error: (err as Error)?.message || 'Failed to verify local file.',
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
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      downloadUrl: `/api/admin/resumes/download?key=${encodeURIComponent(params.key)}&filename=${encodeURIComponent(cleanFilename)}`,
      expiresAt,
    };
  }

  async deleteObject(key: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
}
