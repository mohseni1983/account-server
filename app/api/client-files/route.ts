import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
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

