/**
 * @file admin/src/app/api/admin/resumes/download/route.ts
 * @description [API] Authenticated endpoint for recruitment staff to download candidate resumes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/controllers/auth.controller';
import { getStorageProvider } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const filename = searchParams.get('filename') || 'resume.pdf';

    if (!key) {
      return NextResponse.json({ error: 'Storage object key is required' }, { status: 400 });
    }

    const provider = getStorageProvider();

    // If local provider in dev mode, stream file directly with attachment header
    if (provider.providerName === 'local') {
      const normalizedKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
      const baseDir = path.join(process.cwd(), '.data', 'resumes');
      const filePath = path.join(baseDir, normalizedKey);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      const isDocx = filename.endsWith('.docx');
      const mime = isDocx
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // For R2 or Supabase: generate fresh short-lived signed download URL
    const isDocx = filename.endsWith('.docx');
    const mime = isDocx
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

    const result = await provider.getSecureDownloadUrl({
      key,
      filename,
      mimeType: mime,
      expiresInSeconds: 300,
    });

    return NextResponse.redirect(result.downloadUrl);
  } catch (err) {
    console.error('[Admin Resume Download Error]:', err);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
