import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: 'شناسه فایل نامعتبر است' },
        { status: 400 }
      );
    }

    const file = db.prepare('SELECT * FROM client_files WHERE id = ?').get(fileId) as any;

    if (!file) {
      return NextResponse.json(
        { error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), 'data', 'client-files', file.file_path);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'فایل در سرور یافت نشد' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath);
    const fileExt = path.extname(file.file_path);
    
    // Determine content type based on extension
    const contentTypes: { [key: string]: string } = {
      '.exe': 'application/x-msdownload',
      '.msi': 'application/x-msdownload',
      '.dmg': 'application/x-apple-diskimage',
      '.pkg': 'application/x-newton-compatible-pkg',
      '.deb': 'application/vnd.debian.binary-package',
      '.rpm': 'application/x-rpm',
      '.apk': 'application/vnd.android.package-archive',
      '.zip': 'application/zip',
    };

    const contentType = contentTypes[fileExt] || 'application/octet-stream';

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.name}${fileExt}"`,
        'Content-Length': fileContent.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'خطا در دانلود فایل' },
      { status: 500 }
    );
  }
}

