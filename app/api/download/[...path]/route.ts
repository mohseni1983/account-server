import { NextRequest, NextResponse } from 'next/server';
import { getProfileFilePath } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const filePath = pathArray.join('/');
    const fullPath = getProfileFilePath(filePath);

    // Security check: ensure file exists and is within profiles directory
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    // Verify path is within profiles directory
    const profilesDir = path.join(process.cwd(), 'data', 'profiles');
    const resolvedPath = path.resolve(fullPath);
    const resolvedDir = path.resolve(profilesDir);
    
    if (!resolvedPath.startsWith(resolvedDir)) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    const fileContent = fs.readFileSync(fullPath);
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/x-openvpn-profile',
        'Content-Disposition': `attachment; filename="profile.ovpn"`,
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

