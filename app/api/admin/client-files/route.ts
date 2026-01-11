import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const files = db.prepare('SELECT * FROM client_files ORDER BY platform, created_at DESC').all();

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error('Get client files error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت فایل‌ها' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه فایل الزامی است' },
        { status: 400 }
      );
    }

    const file = db.prepare('SELECT * FROM client_files WHERE id = ?').get(parseInt(id)) as any;

    if (!file) {
      return NextResponse.json(
        { error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'data', 'client-files', file.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    db.prepare('DELETE FROM client_files WHERE id = ?').run(parseInt(id));

    return NextResponse.json({
      success: true,
      message: 'فایل حذف شد',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'خطا در حذف فایل' },
      { status: 500 }
    );
  }
}

