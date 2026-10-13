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
import { generateUploadSessionToken, verifyUploadSessionToken } from './token';
import crypto from 'crypto';

const STAGING_KEY_PATTERN = /^staging\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{32}\.(pdf|docx)$/i;
const FINAL_KEY_PATTERN = /^resumes\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{32}\.(pdf|docx)$/i;

export class LocalStorageProvider implements StorageProvider {
  readonly providerName: StorageProviderType = 'local';
  private baseDir: string;

  constructor() {
    // Strictly prevent local disk fallback in production environments
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Access denied: LocalStorageProvider is restricted to authorized local development and testing environments only.'
      );
    }
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
    const ext = (cleanName.split('.').pop() || 'pdf').toLowerCase();

    if (ext !== 'pdf' && ext !== 'docx') {
      throw new Error('Unsupported file extension. Only PDF and DOCX files are permitted.');
    }

    const stagingKey = `staging/${datePrefix}/${randomHex}.${ext}`;
    const finalKey = `resumes/${datePrefix}/${randomHex}.${ext}`;
    const { sessionToken, expiresAt } = generateUploadSessionToken(stagingKey, finalKey, 900);

    return {
      provider: 'local',
      uploadUrl: `/api/applications/upload-direct?key=${encodeURIComponent(stagingKey)}&token=${encodeURIComponent(sessionToken)}`,
      stagingKey,
      finalKey,
      sessionToken,
      expiresAt,
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
      const stagingPath = path.join(this.baseDir, params.stagingKey);
      if (fs.existsSync(stagingPath)) {
        try { fs.unlinkSync(stagingPath); } catch {}
      }
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: tokenCheck.error || 'Invalid upload session token.',
      };
    }

    const stagingPath = path.join(this.baseDir, params.stagingKey);
    const finalPath = path.join(this.baseDir, params.finalKey);

    // 3. Replay protection: prevent overwriting existing final object
    if (fs.existsSync(finalPath)) {
      if (fs.existsSync(stagingPath)) {
        try { fs.unlinkSync(stagingPath); } catch {}
      }
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: 'Destination resume object already exists. Replay or overwrite is prohibited.',
      };
    }

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

      if (buffer.length === 0) {
        fs.unlinkSync(stagingPath);
        return {
          verified: false,
          actualSizeBytes: 0,
          verifiedMime: '',
          error: 'Uploaded object is empty.',
        };
      }

      if (buffer.length > 10 * 1024 * 1024) {
        fs.unlinkSync(stagingPath);
        return {
          verified: false,
          actualSizeBytes: buffer.length,
          verifiedMime: '',
          error: 'Uploaded file exceeds 10MB limit.',
        };
      }

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
      if (fs.existsSync(stagingPath)) {
        try { fs.unlinkSync(stagingPath); } catch {}
      }
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

  async saveBuffer(key: string, buffer: Buffer, _mimeType?: string): Promise<boolean> {
    const normalizedKey = key.replace(/\\/g, '/');
    const targetPath = path.resolve(this.baseDir, normalizedKey);
    const resolvedBase = path.resolve(this.baseDir);

    // Cross-platform path traversal containment
    if (!targetPath.startsWith(resolvedBase + path.sep)) {
      throw new Error('Access denied: Path traversal detected');
    }

    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(targetPath, buffer);
    return true;
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
