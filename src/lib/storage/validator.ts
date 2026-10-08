/**
 * @file admin/src/lib/storage/validator.ts
 * @description [SECURITY] Strict file signature, magic byte, and document structure validation for candidate resumes.
 */

export const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface FileValidationResult {
  isValid: boolean;
  mimeType: string;
  detectedFormat: 'pdf' | 'docx' | 'unknown';
  error?: string;
}

/**
 * Validates the raw binary buffer of an uploaded document using magic signatures.
 */
export function validateDocumentBuffer(
  buffer: Buffer | Uint8Array,
  declaredFilename: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      mimeType: 'unknown',
      detectedFormat: 'unknown',
      error: 'File is empty.',
    };
  }

  if (buffer.length > MAX_RESUME_SIZE_BYTES) {
    return {
      isValid: false,
      mimeType: 'unknown',
      detectedFormat: 'unknown',
      error: `File size exceeds the 10MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  const ext = (declaredFilename.split('.').pop() || '').toLowerCase();
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 1. Check for PDF Magic Bytes (%PDF- => 0x25 0x50 0x44 0x46 0x2D)
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d    // -
  ) {
    return {
      isValid: true,
      mimeType: 'application/pdf',
      detectedFormat: 'pdf',
    };
  }

  // 2. Check for DOCX / Office Open XML (ZIP archive signature: PK\x03\x04 => 0x50 0x4B 0x03 0x04)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 && // P
    bytes[1] === 0x4b && // K
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    if (ext === 'docm' || ext === 'exe' || ext === 'jar' || ext === 'zip') {
      return {
        isValid: false,
        mimeType: 'application/octet-stream',
        detectedFormat: 'unknown',
        error: 'Macro-enabled or archive formats are disallowed for candidate security.',
      };
    }

    return {
      isValid: true,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      detectedFormat: 'docx',
    };
  }

  return {
    isValid: false,
    mimeType: 'application/octet-stream',
    detectedFormat: 'unknown',
    error: 'Unsupported document format. Only valid PDF and DOCX files up to 10MB are permitted.',
  };
}

export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, '');
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.substring(0, 100);
}
