/**
 * @file admin/src/lib/storage/validator.ts
 * @description [SECURITY] Strict file signature, magic byte, and genuine ZIP/Office Open XML package validation for candidate resumes.
 */

import zlib from 'zlib';

export const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface FileValidationResult {
  isValid: boolean;
  mimeType: string;
  detectedFormat: 'pdf' | 'docx' | 'unknown';
  error?: string;
}

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

/**
 * Parses and verifies an Office Open XML DOCX package using genuine ZIP structure parsing.
 * Validates End of Central Directory, Central Directory records, decompression bomb limits,
 * unsafe path traversal, macro absence, and mandatory Word Open XML components.
 */
function validateDocxZipPackage(buffer: Buffer): { isValid: boolean; error?: string } {
  if (buffer.length < 22) {
    return { isValid: false, error: 'File is too small to be a valid DOCX package.' };
  }

  // 1. Locate End of Central Directory (EOCD) signature 0x06054b50
  // Search backwards within the maximum possible comment boundary
  const maxSearch = Math.min(buffer.length, 65557);
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= buffer.length - maxSearch; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    return {
      isValid: false,
      error: 'Malformed or corrupt ZIP archive. End of Central Directory (EOCD) signature not found.',
    };
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const cdSize = buffer.readUInt32LE(eocdOffset + 12);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (cdOffset + cdSize > eocdOffset) {
    return {
      isValid: false,
      error: 'Corrupted ZIP archive: Central directory boundaries exceed EOCD offset.',
    };
  }

  const entries = new Map<string, ZipEntry>();
  let currOffset = cdOffset;
  let totalUncompressedSize = 0;

  for (let i = 0; i < entryCount; i++) {
    if (currOffset + 46 > buffer.length) {
      return { isValid: false, error: 'Corrupted ZIP central directory header is truncated.' };
    }

    const sig = buffer.readUInt32LE(currOffset);
    if (sig !== 0x02014b50) {
      return { isValid: false, error: `Invalid central directory header signature at index ${i}.` };
    }

    const compressionMethod = buffer.readUInt16LE(currOffset + 10);
    const compressedSize = buffer.readUInt32LE(currOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(currOffset + 24);
    const nameLen = buffer.readUInt16LE(currOffset + 28);
    const extraLen = buffer.readUInt16LE(currOffset + 30);
    const commentLen = buffer.readUInt16LE(currOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(currOffset + 42);

    if (currOffset + 46 + nameLen > buffer.length) {
      return { isValid: false, error: 'Corrupted ZIP filename field extends beyond buffer boundaries.' };
    }

    const name = buffer.toString('utf8', currOffset + 46, currOffset + 46 + nameLen);
    const lowerName = name.toLowerCase();

    // Security check 1: Path Traversal / Zip Slip protection
    if (name.includes('..') || name.startsWith('/') || name.startsWith('\\') || name.includes(':')) {
      return { isValid: false, error: `Path traversal or unsafe directory character detected in entry: "${name}".` };
    }

    // Security check 2: Reject active content, macros, executables, scripts
    if (
      lowerName.includes('vbaproject.bin') ||
      lowerName.includes('vba') ||
      lowerName.endsWith('.docm') ||
      lowerName.endsWith('.exe') ||
      lowerName.endsWith('.bat') ||
      lowerName.endsWith('.cmd')
    ) {
      return { isValid: false, error: `Disallowed active content or macro component detected: "${name}".` };
    }

    // Security check 3: Decompression Bomb prevention
    totalUncompressedSize += uncompressedSize;
    if (totalUncompressedSize > 50 * 1024 * 1024) {
      return { isValid: false, error: 'Decompression bomb protection: total uncompressed content exceeds 50MB limit.' };
    }
    if (compressedSize > 0 && uncompressedSize > compressedSize * 100 && uncompressedSize > 1024 * 1024) {
      return { isValid: false, error: `Decompression bomb protection: abnormal compression ratio detected on "${name}".` };
    }

    entries.set(name, {
      name,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    currOffset += 46 + nameLen + extraLen + commentLen;
  }

  // Office Open XML DOCX Structural Requirements:
  // Must contain [Content_Types].xml and word/document.xml
  if (!entries.has('[Content_Types].xml')) {
    return {
      isValid: false,
      error: 'Invalid DOCX structure: missing root [Content_Types].xml component.',
    };
  }

  const hasWordDoc = entries.has('word/document.xml') || Array.from(entries.keys()).some((k) => k.toLowerCase() === 'word/document.xml');
  if (!hasWordDoc) {
    return {
      isValid: false,
      error: 'Invalid DOCX structure: missing word/document.xml component.',
    };
  }

  // Decompress and verify [Content_Types].xml to ensure it references WordprocessingML
  const ctEntry = entries.get('[Content_Types].xml')!;
  const lhOffset = ctEntry.localHeaderOffset;
  if (lhOffset + 30 > buffer.length || buffer.readUInt32LE(lhOffset) !== 0x04034b50) {
    return { isValid: false, error: 'Corrupted local file header for [Content_Types].xml component.' };
  }
  const lhNameLen = buffer.readUInt16LE(lhOffset + 26);
  const lhExtraLen = buffer.readUInt16LE(lhOffset + 28);
  const dataOffset = lhOffset + 30 + lhNameLen + lhExtraLen;

  if (dataOffset + ctEntry.compressedSize > buffer.length) {
    return { isValid: false, error: 'Corrupted [Content_Types].xml data stream exceeds buffer length.' };
  }

  const compressedData = buffer.subarray(dataOffset, dataOffset + ctEntry.compressedSize);

  let ctContent = '';
  try {
    if (ctEntry.compressionMethod === 0) {
      ctContent = compressedData.toString('utf8');
    } else if (ctEntry.compressionMethod === 8) {
      ctContent = zlib.inflateRawSync(compressedData).toString('utf8');
    } else {
      return { isValid: false, error: `Unsupported ZIP compression method ${ctEntry.compressionMethod}.` };
    }
  } catch (err) {
    return { isValid: false, error: `Failed to decompress [Content_Types].xml: ${(err as Error)?.message}` };
  }

  if (!ctContent.includes('wordprocessingml') && !ctContent.includes('officeDocument')) {
    return {
      isValid: false,
      error: 'Invalid DOCX package: [Content_Types].xml does not define WordprocessingML content types.',
    };
  }

  return { isValid: true };
}

/**
 * Validates the raw binary buffer of an uploaded document using genuine magic signatures
 * and deep package structure validation. Does not trust client-declared MIME headers alone.
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
  const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // 1. PDF Verification: starts with %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    nodeBuf.length >= 5 &&
    nodeBuf[0] === 0x25 && // %
    nodeBuf[1] === 0x50 && // P
    nodeBuf[2] === 0x44 && // D
    nodeBuf[3] === 0x46 && // F
    nodeBuf[4] === 0x2d    // -
  ) {
    // Check for malicious embedded scripts or HTML cloaking
    const headerSnippet = nodeBuf.subarray(0, 1024).toString('latin1').toLowerCase();
    if (headerSnippet.includes('<html') || headerSnippet.includes('<script')) {
      return {
        isValid: false,
        mimeType: 'application/octet-stream',
        detectedFormat: 'unknown',
        error: 'Unsupported document format. HTML or executable scripts cloaked as PDF are prohibited.',
      };
    }

    return {
      isValid: true,
      mimeType: 'application/pdf',
      detectedFormat: 'pdf',
    };
  }

  // 2. DOCX / Office Open XML Verification (ZIP signature: PK\x03\x04 => 0x50 0x4B 0x03 0x04)
  if (
    nodeBuf.length >= 4 &&
    nodeBuf[0] === 0x50 && // P
    nodeBuf[1] === 0x4b && // K
    nodeBuf[2] === 0x03 &&
    nodeBuf[3] === 0x04
  ) {
    // Explicitly reject dangerous or macro-enabled file extensions
    if (ext === 'docm' || ext === 'exe' || ext === 'jar' || ext === 'zip' || ext === 'bat') {
      return {
        isValid: false,
        mimeType: 'application/octet-stream',
        detectedFormat: 'unknown',
        error: 'Macro-enabled or raw archive formats are disallowed for candidate security.',
      };
    }

    // Perform genuine ZIP and Office Open XML package validation
    const zipCheck = validateDocxZipPackage(nodeBuf);
    if (!zipCheck.isValid) {
      return {
        isValid: false,
        mimeType: 'application/octet-stream',
        detectedFormat: 'unknown',
        error: zipCheck.error || 'Invalid DOCX structure. File is not a valid Office Open XML package.',
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

/**
 * Sanitizes a filename to prevent path traversal and special character injection.
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, '');
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.substring(0, 100);
}
