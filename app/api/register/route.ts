import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateTrackingCode } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { mobile, national_id, referrer_name } = await request.json();

    // Validation
    if (!mobile || !national_id || !referrer_name) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی است' },
        { status: 400 }
      );
    }

    // Check if mobile or national_id already exists
    const existing = db
      .prepare('SELECT * FROM users WHERE mobile = ? OR national_id = ?')
      .get(mobile, national_id);

    if (existing) {
      return NextResponse.json(
        { error: 'این شماره موبایل یا کد ملی قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Generate unique tracking code
    let trackingCode = generateTrackingCode();
    let exists = db.prepare('SELECT id FROM users WHERE tracking_code = ?').get(trackingCode);
    
    while (exists) {
      trackingCode = generateTrackingCode();
      exists = db.prepare('SELECT id FROM users WHERE tracking_code = ?').get(trackingCode);
    }

    // Insert user
    const result = db
      .prepare(
        'INSERT INTO users (mobile, national_id, referrer_name, tracking_code) VALUES (?, ?, ?, ?)'
      )
      .run(mobile, national_id, referrer_name, trackingCode);

    return NextResponse.json({
      success: true,
      tracking_code: trackingCode,
      message: 'ثبت نام با موفقیت انجام شد',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت نام' },
      { status: 500 }
    );
  }
}

