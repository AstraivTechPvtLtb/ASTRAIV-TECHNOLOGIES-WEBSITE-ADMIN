/**
 * @file admin/src/lib/storage/r2-provider.ts
 * @description [STORAGE] Cloudflare R2 Standard private bucket adapter for candidate resumes.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

export class CloudflareR2StorageProvider implements StorageProvider {
  readonly providerName: StorageProviderType = 'r2';
  private s3: S3Client;
  private bucket: string;

  constructor() {
    const accountId = (process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim();
    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim();
    // Strictly separate private candidate-resume bucket from public asset storage
    this.bucket = (process.env.R2_RESUME_BUCKET_NAME || 'astraiv-candidate-resumes').trim();

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  static isConfigured(): boolean {
    const rawAccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const rawAccessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const rawSecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!rawAccountId || !rawAccessKeyId || !rawSecretAccessKey) {
      return false;
    }

    const accountId = rawAccountId.trim();
    const accessKeyId = rawAccessKeyId.trim();
    const secretAccessKey = rawSecretAccessKey.trim();

    const isPlaceholder = (val: string) =>
      val.startsWith('your_') ||
      val.includes('placeholder') ||
      val.includes('example') ||
      val.includes('xxx') ||
      val.startsWith('<');

    return !isPlaceholder(accountId) && !isPlaceholder(accessKeyId) && !isPlaceholder(secretAccessKey);
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

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: stagingKey,
      ContentType: req.mimeType,
      Metadata: {
        sessionToken,
        originalFilename: encodeURIComponent(cleanName),
      },
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });

    return {
      provider: 'r2',
      uploadUrl,
      stagingKey,
      finalKey,
      sessionToken,
      expiresAt,
      headers: {
        'Content-Type': req.mimeType,
      },
    };
  }

  async verifyAndPromoteObject(params: {
    stagingKey: string;
    finalKey: string;
    expectedMime: string;
    sessionToken: string;
  }): Promise<VerifyObjectResult> {
    try {
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

      // 2. Validate cryptographic upload session token strictly bound to stagingKey and finalKey
      const tokenCheck = verifyUploadSessionToken(params.stagingKey, params.finalKey, params.sessionToken);
      if (!tokenCheck.valid) {
        await this.deleteObject(params.stagingKey).catch(() => {});
        return {
          verified: false,
          actualSizeBytes: 0,
          verifiedMime: '',
          error: tokenCheck.error || 'Invalid upload session token.',
        };
      }

      // 3. Replay protection & overwrite prevention: ensure destination object does NOT already exist
      try {
        const destCheck = await this.s3.send(
          new HeadObjectCommand({
            Bucket: this.bucket,
            Key: params.finalKey,
          })
        );
        if (destCheck) {
          // Destination object already exists: reject replay / overwrite attempt
          await this.deleteObject(params.stagingKey).catch(() => {});
          return {
            verified: false,
            actualSizeBytes: 0,
            verifiedMime: '',
            error: 'Destination resume object already exists. Replay or overwrite is prohibited.',
          };
        }
      } catch (headErr: unknown) {
        // Expected behavior: destination key must not exist (404 / NotFound)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errObj = headErr as any;
        if (errObj?.name !== 'NotFound' && errObj?.$metadata?.httpStatusCode !== 404 && !errObj?.message?.includes('Not Found')) {
          console.warn('[R2 Destination Head Check]: Non-404 status received, continuing verification.', errObj?.name);
        }
      }

      // 4. Verify staging object presence and actual stored object size
      const head = await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: params.stagingKey,
        })
      );

      const actualSize = head.ContentLength || 0;
      if (actualSize === 0) {
        await this.deleteObject(params.stagingKey).catch(() => {});
        return { verified: false, actualSizeBytes: 0, verifiedMime: '', error: 'Uploaded object is empty.' };
      }
      if (actualSize > 10 * 1024 * 1024) {
        await this.deleteObject(params.stagingKey).catch(() => {});
        return {
          verified: false,
          actualSizeBytes: actualSize,
          verifiedMime: '',
          error: `Uploaded file exceeds the 10MB limit (size: ${(actualSize / (1024 * 1024)).toFixed(2)} MB).`,
        };
      }

      // 5. Download the ENTIRE document (not a partial 64KB sample) for comprehensive verification
      const getObj = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: params.stagingKey,
        })
      );

      const streamToBuffer = async (stream: unknown): Promise<Buffer> => {
        const chunks: Buffer[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for await (const chunk of stream as any) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      };

      const fullBuffer = await streamToBuffer(getObj.Body);
      if (fullBuffer.length !== actualSize) {
        await this.deleteObject(params.stagingKey).catch(() => {});
        return {
          verified: false,
          actualSizeBytes: fullBuffer.length,
          verifiedMime: '',
          error: 'Stored object size mismatch during download verification.',
        };
      }

      // 6. Deep document structure, magic bytes, and ZIP/Open XML package validation
      const valResult = validateDocumentBuffer(fullBuffer, params.stagingKey);
      if (!valResult.isValid) {
        await this.deleteObject(params.stagingKey).catch(() => {});
        return {
          verified: false,
          actualSizeBytes: actualSize,
          verifiedMime: valResult.mimeType,
          error: valResult.error || 'Document signature verification failed.',
        };
      }

      // 7. Atomic promotion: copy validated staging object to server-only final key
      await this.s3.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${params.stagingKey}`,
          Key: params.finalKey,
          MetadataDirective: 'COPY',
        })
      );

      // 8. Safely retire staging object
      await this.deleteObject(params.stagingKey).catch(() => {});

      return {
        verified: true,
        actualSizeBytes: actualSize,
        verifiedMime: valResult.mimeType,
      };
    } catch (err) {
      console.error('[R2 Verify & Promote Error]:', err);
      // Clean up staging object on unexpected error
      await this.deleteObject(params.stagingKey).catch(() => {});
      return {
        verified: false,
        actualSizeBytes: 0,
        verifiedMime: '',
        error: (err as Error)?.message || 'Failed to verify upload in storage.',
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

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ResponseContentDisposition: `attachment; filename="${cleanFilename}"`,
      ResponseContentType: params.mimeType,
    });

    const downloadUrl = await getSignedUrl(this.s3, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return { downloadUrl, expiresAt };
  }

  async saveBuffer(key: string, buffer: Buffer, mimeType: string): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });
      await this.s3.send(command);
      return true;
    } catch (err) {
      console.error('[R2 saveBuffer Error]:', err);
      return false;
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (err) {
      console.warn('[R2 Delete Warning]:', err);
      return false;
    }
  }
}
