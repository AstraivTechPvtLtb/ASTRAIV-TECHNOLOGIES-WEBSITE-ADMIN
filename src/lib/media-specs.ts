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
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*['"]javascript:[^'"]*['"]/gi, '')
    .replace(/xlink:href\s*=\s*['"]javascript:[^'"]*['"]/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}
