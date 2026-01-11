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

    const { 
      user_id, 
      username, 
      password, 
      connection_type = 'openvpn',
      bandwidth_limit = 0,
      v2ray_config,
    } = await request.json();

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

    let profilePath = null;

    if (connection_type === 'openvpn') {
      // Create OpenVPN profile file
      profilePath = createProfileFile(existingUser.tracking_code, MASTER_PROFILE_PATH);
    }

    // Validate V2Ray config if connection type is V2Ray
    if (connection_type === 'v2ray' && !v2ray_config) {
      return NextResponse.json(
        { error: 'آدرس V2Ray الزامی است' },
        { status: 400 }
      );
    }

    // Update user
    const updateQuery = connection_type === 'openvpn'
      ? 'UPDATE users SET status = ?, username = ?, password = ?, profile_file_path = ?, connection_type = ?, bandwidth_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      : 'UPDATE users SET status = ?, username = ?, password = ?, v2ray_config = ?, connection_type = ?, bandwidth_limit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    if (connection_type === 'openvpn') {
      db.prepare(updateQuery).run('approved', username, password, profilePath, connection_type, bandwidth_limit, user_id);
    } else {
      db.prepare(updateQuery).run('approved', username, password, v2ray_config, connection_type, bandwidth_limit, user_id);
    }

    // Get updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id) as any;
    const { password: pwd, ...userData } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userData,
      profile_url: profilePath ? `/api/download/${profilePath}` : null,
    });
  } catch (error: any) {
    console.error('Approve error:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در تایید درخواست' },
      { status: 500 }
    );
  }
}
