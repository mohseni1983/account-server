import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { tracking_code } = await request.json();

    if (!tracking_code) {
      return NextResponse.json(
        { error: 'کد رهگیری الزامی است' },
        { status: 400 }
      );
    }

    const user = db
      .prepare('SELECT * FROM users WHERE tracking_code = ?')
      .get(tracking_code) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'کد رهگیری یافت نشد' },
        { status: 404 }
      );
    }

    // Don't expose password hash
    const { password, ...userData } = user;

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error('Track error:', error);
    return NextResponse.json(
      { error: 'خطا در جستجو' },
      { status: 500 }
    );
  }
}

