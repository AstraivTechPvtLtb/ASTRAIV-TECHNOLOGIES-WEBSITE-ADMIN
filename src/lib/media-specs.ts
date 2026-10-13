export interface MediaSlotSpec {
  slotKey: string;
  name: string;
  recommendedWidth: number;
  recommendedHeight: number;
  aspectRatio: string;
  maxSizeBytes: number;
  maxSizeLabel: string;
  allowedFormats: string[];
  description: string;
}

export interface MediaAssetItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  altText?: string | null;
  caption?: string | null;
  focalPoint?: string | null;
  slot?: string | null;
  isPrivate: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const MEDIA_SLOT_SPECS: Record<string, MediaSlotSpec> = {
  hero: {
    slotKey: 'hero',
    name: 'Hero Background / Banner',
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    aspectRatio: '16:9',
    maxSizeBytes: 2.5 * 1024 * 1024,
    maxSizeLabel: '2.5 MB',
    allowedFormats: ['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml'],
    description: 'High-resolution banner rendered behind headers and ambient glow on desktop displays.'
  },
  engagement_hero: {
    slotKey: 'engagement_hero',
    name: 'Engagement Models Page Image',
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    aspectRatio: '16:9',
    maxSizeBytes: 2.5 * 1024 * 1024,
    maxSizeLabel: '2.5 MB',
    allowedFormats: ['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml'],
    description: 'High-resolution engineering collaboration and project roadmap image rendered between the hero introduction and the engagement models catalog on the client website.'
  },
  careers_hero: {
    slotKey: 'careers_hero',
    name: 'Careers & Roles Page Image',
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    aspectRatio: '16:9',
    maxSizeBytes: 2.5 * 1024 * 1024,
    maxSizeLabel: '2.5 MB',
    allowedFormats: ['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml'],
    description: 'High-resolution engineering culture and collaborative workspace image rendered on the client careers page.'
  },
  service_icon: {
    slotKey: 'service_icon',
    name: 'Service Offering Icon',
    recommendedWidth: 512,
    recommendedHeight: 512,
    aspectRatio: '1:1',
    maxSizeBytes: 250 * 1024,
    maxSizeLabel: '250 KB',
    allowedFormats: ['image/svg+xml', 'image/webp', 'image/png'],
    description: 'Square crisp icon or badge rendered in services grid and capability cards.'
  },
  tech_logo: {
    slotKey: 'tech_logo',
    name: 'Technology Logo',
    recommendedWidth: 256,
    recommendedHeight: 256,
    aspectRatio: '1:1',
    maxSizeBytes: 150 * 1024,
    maxSizeLabel: '150 KB',
    allowedFormats: ['image/svg+xml', 'image/png'],
    description: 'Official tech stack brand logo rendered in tech ticker and architecture badges.'
  },
  project_cover: {
    slotKey: 'project_cover',
    name: 'Case Study Project Cover',
    recommendedWidth: 1200,
    recommendedHeight: 675,
    aspectRatio: '16:9',
    maxSizeBytes: 1.5 * 1024 * 1024,
    maxSizeLabel: '1.5 MB',
    allowedFormats: ['image/webp', 'image/jpeg', 'image/png'],
    description: 'Featured portfolio image card on work directory and case study detail headers.'
  },
  client_avatar: {
    slotKey: 'client_avatar',
    name: 'Client / Reviewer Avatar',
    recommendedWidth: 256,
    recommendedHeight: 256,
    aspectRatio: '1:1',
    maxSizeBytes: 200 * 1024,
    maxSizeLabel: '200 KB',
    allowedFormats: ['image/webp', 'image/jpeg', 'image/png'],
    description: 'Headshot or profile picture for verified client reviews and testimonials.'
  },
  blog_cover: {
    slotKey: 'blog_cover',
    name: 'Article Cover / Social OpenGraph',
    recommendedWidth: 1200,
    recommendedHeight: 630,
    aspectRatio: '1.91:1',
    maxSizeBytes: 1.5 * 1024 * 1024,
    maxSizeLabel: '1.5 MB',
    allowedFormats: ['image/webp', 'image/jpeg', 'image/png'],
    description: 'Featured article header and social media OpenGraph share card.'
  },
  trust_cert: {
    slotKey: 'trust_cert',
    name: 'Compliance / Award Badge Logo',
    recommendedWidth: 400,
    recommendedHeight: 400,
    aspectRatio: '1:1',
    maxSizeBytes: 300 * 1024,
    maxSizeLabel: '300 KB',
    allowedFormats: ['image/svg+xml', 'image/png', 'image/webp'],
    description: 'Accreditation symbol, ISO badge, or partnership emblem.'
  },
  private_document: {
    slotKey: 'private_document',
    name: 'Private Document / Candidate Resume',
    recommendedWidth: 0,
    recommendedHeight: 0,
    aspectRatio: 'N/A',
    maxSizeBytes: 10 * 1024 * 1024,
    maxSizeLabel: '10.0 MB',
    allowedFormats: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    description: 'Restricted candidate resume or internal contract document.'
  }
};

/**
 * Sanitizes SVG markup to strip out JavaScript payloads, event handlers, and malicious tags.
 */
export function sanitizeSvgContent(rawSvg: string): string {
  return rawSvg
    // Strip XML declarations and DTD / Entity definitions (XXE prevention)
    .replace(/<!DOCTYPE\b[^>]*>/gi, '')
    .replace(/<!ENTITY\b[^>]*>/gi, '')
    // Strip scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip HTML foreignObject embedding
    .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
    // Strip inline event handlers (onload, onerror, onclick, onmouseover, etc.)
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Strip javascript: and vbscript: URIs in href and xlink:href
    .replace(/(href|xlink:href)\s*=\s*['"]\s*(?:javascript:|vbscript:|data:text\/html)[^'"]*['"]/gi, '')
    // Strip dangerous tags: iframe, object, embed, applet, meta, link, base
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    .replace(/<meta\b[^>]*\/?>/gi, '')
    .replace(/<link\b[^>]*\/?>/gi, '')
    .replace(/<base\b[^>]*\/?>/gi, '')
    // Strip external <use> tags that reference remote URLs or data URIs
    .replace(/<use\b[^>]*\b(?:href|xlink:href)\s*=\s*['"]\s*(?!#)[^'"]+['"][^>]*\/?>/gi, '')
    // Strip dangerous animation tags targeting href or javascript
    .replace(/<animate\b[^>]*\b(?:attributeName\s*=\s*['"]?(?:href|xlink:href)['"]?|\bto\s*=\s*['"]?javascript:)[^>]*\/?>/gi, '')
    .replace(/<set\b[^>]*\b(?:attributeName\s*=\s*['"]?(?:href|xlink:href)['"]?|\bto\s*=\s*['"]?javascript:)[^>]*\/?>/gi, '');
}

/**
 * Detects whether an SVG payload contains malicious, active, or disallowed constructs.
 */
export function detectUnsafeSvgPayload(rawSvg: string): { isUnsafe: boolean; reason?: string } {
  if (/<script\b/i.test(rawSvg)) {
    return { isUnsafe: true, reason: 'Embedded <script> tags are forbidden in SVG assets.' };
  }
  if (/\bon\w+\s*=/i.test(rawSvg)) {
    return { isUnsafe: true, reason: 'Inline event handlers (onload, onerror, etc.) are forbidden in SVG assets.' };
  }
  if (/(?:href|xlink:href)\s*=\s*['"]\s*(?:javascript:|vbscript:|data:text\/html)/i.test(rawSvg)) {
    return { isUnsafe: true, reason: 'Executable script URIs (javascript:, etc.) are forbidden in SVG assets.' };
  }
  if (/<(?:foreignObject|iframe|object|embed|applet|meta|link|base)\b/i.test(rawSvg)) {
    return { isUnsafe: true, reason: 'Active container tags (<foreignObject>, <iframe>, etc.) are forbidden in SVG assets.' };
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(rawSvg)) {
    return { isUnsafe: true, reason: 'XML Entity / DTD declarations are forbidden in SVG assets (XXE protection).' };
  }
  if (/<use\b[^>]*\b(?:href|xlink:href)\s*=\s*['"]\s*(?!#)[^'"]+['"]/i.test(rawSvg)) {
    return { isUnsafe: true, reason: 'External resource references in <use> tags are forbidden in SVG assets.' };
  }
  return { isUnsafe: false };
}

/**
 * Verifies SVG safety and returns the sanitized markup.
 * Rejects unsafe SVG documents rather than accepting them unchanged.
 */
export function verifyAndSanitizeSvg(rawSvg: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!rawSvg || !/<svg\b/i.test(rawSvg)) {
    return { isValid: false, sanitized: '', error: 'The provided content is not a valid SVG document.' };
  }

  const check = detectUnsafeSvgPayload(rawSvg);
  if (check.isUnsafe) {
    return {
      isValid: false,
      sanitized: '',
      error: `Security policy violation: ${check.reason || 'Unsafe SVG markup detected.'}`,
    };
  }

  const sanitized = sanitizeSvgContent(rawSvg);
  return { isValid: true, sanitized };
}
