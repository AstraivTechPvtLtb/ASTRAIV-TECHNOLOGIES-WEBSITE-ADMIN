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
import crypto from 'crypto';

export class CloudflareR2StorageProvider implements StorageProvider {
  readonly providerName: StorageProviderType = 'r2';
  private s3: S3Client;
  private bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    this.bucket = process.env.R2_RESUME_BUCKET_NAME || 'astraiv-candidate-resumes';

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
    return Boolean(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
    );
  }

  async createUploadSession(req: UploadSessionRequest): Promise<UploadSessionResponse> {
    const cleanName = sanitizeFilename(req.filename);
    const datePrefix = new Date().toISOString().split('T')[0];
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext = cleanName.split('.').pop() || 'pdf';

    const stagingKey = `staging/${datePrefix}/${randomHex}.${ext}`;
    const finalKey = `resumes/${datePrefix}/${randomHex}.${ext}`;
    const sessionToken = crypto.randomBytes(24).toString('hex');

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
    const expiresAt = new Date(Date.now() + 900 * 1000).toISOString();

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
      const head = await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: params.stagingKey,
        })
      );

      const actualSize = head.ContentLength || 0;
      if (actualSize === 0) {
        return { verified: false, actualSizeBytes: 0, verifiedMime: '', error: 'Uploaded object is empty.' };
      }

      const getObj = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: params.stagingKey,
          Range: 'bytes=0-1023',
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

      const headerBuffer = await streamToBuffer(getObj.Body);
      const valResult = validateDocumentBuffer(headerBuffer, params.stagingKey);

      if (!valResult.isValid) {
        await this.deleteObject(params.stagingKey).catch(() => {});
        return {
          verified: false,
          actualSizeBytes: actualSize,
          verifiedMime: valResult.mimeType,
          error: valResult.error || 'Document signature verification failed.',
        };
      }

      await this.s3.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${params.stagingKey}`,
          Key: params.finalKey,
          MetadataDirective: 'COPY',
        })
      );

      await this.deleteObject(params.stagingKey).catch(() => {});

      return {
        verified: true,
        actualSizeBytes: actualSize,
        verifiedMime: valResult.mimeType,
      };
    } catch (err) {
      console.error('[R2 Verify & Promote Error]:', err);
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
