import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    const admin = db
      .prepare('SELECT * FROM admins WHERE username = ?')
      .get(username) as any;

    if (!admin) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    const isValid = bcrypt.compareSync(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطا در ورود' },
      { status: 500 }
    );
  }
}

