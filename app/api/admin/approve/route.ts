import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { createProfileFile, getProfileFilePath } from '@/lib/utils';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MASTER_PROFILE_PATH = path.join(process.cwd(), 'data', 'master-profile.ovpn');

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

    const { user_id, username, password } = await request.json();

    if (!user_id || !username || !password) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی است' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id) as any;
    if (!existingUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Create profile file
    const profilePath = createProfileFile(existingUser.tracking_code, MASTER_PROFILE_PATH);

    // Update user
    db.prepare(
      'UPDATE users SET status = ?, username = ?, password = ?, profile_file_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('approved', username, password, profilePath, user_id);

    // Get updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id) as any;
    const { password: pwd, ...userData } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userData,
      profile_url: `/api/download/${profilePath}`,
    });
  } catch (error: any) {
    console.error('Approve error:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در تایید درخواست' },
      { status: 500 }
    );
  }
}

