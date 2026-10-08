/**
 * @file admin/src/lib/storage/types.ts
 * @description [STORAGE] Core contracts and types for secure candidate resume storage.
 */

export type StorageProviderType = 'r2' | 'supabase' | 'local';

export interface UploadSessionRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  candidateName?: string;
  roleSlug?: string;
  isSpeculative?: boolean;
}

export interface UploadSessionResponse {
  provider: StorageProviderType;
  uploadUrl: string;
  stagingKey: string;
  finalKey: string;
  sessionToken: string;
  expiresAt: string;
  headers?: Record<string, string>;
}

export interface VerifyObjectResult {
  verified: boolean;
  actualSizeBytes: number;
  verifiedMime: string;
  error?: string;
}

export interface DownloadUrlResult {
  downloadUrl: string;
  expiresAt: string;
}

export interface StorageProvider {
  readonly providerName: StorageProviderType;
  
  /**
   * Generates a short-lived, rate-limited upload session with a direct presigned URL.
   */
  createUploadSession(req: UploadSessionRequest): Promise<UploadSessionResponse>;

  /**
   * Verifies the uploaded object in staging (magic numbers, exact size) and promotes it to a permanent server-only key.
   */
  verifyAndPromoteObject(params: {
    stagingKey: string;
    finalKey: string;
    expectedMime: string;
    sessionToken: string;
  }): Promise<VerifyObjectResult>;

  /**
   * Generates an authenticated, short-lived download URL with attachment disposition for admin review.
   */
  getSecureDownloadUrl(params: {
    key: string;
    filename: string;
    mimeType: string;
    expiresInSeconds?: number;
  }): Promise<DownloadUrlResult>;

  /**
   * Permanently deletes an object from storage.
   */
  deleteObject(key: string): Promise<boolean>;
}
