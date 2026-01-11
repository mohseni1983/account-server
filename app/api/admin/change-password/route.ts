import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const { current_password, new_password, confirm_password } = await request.json();

    if (!current_password || !new_password || !confirm_password) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی است' },
        { status: 400 }
      );
    }

    if (new_password !== confirm_password) {
      return NextResponse.json(
        { error: 'رمز عبور جدید و تأیید آن مطابقت ندارند' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      );
    }

    // Get admin from database
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(user.id) as any;
    if (!admin) {
      return NextResponse.json(
        { error: 'ادمین یافت نشد' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = bcrypt.compareSync(current_password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'رمز عبور فعلی اشتباه است' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = bcrypt.hashSync(new_password, 10);

    // Update password
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newPasswordHash, user.id);

    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر رمز عبور' },
      { status: 500 }
    );
  }
}

