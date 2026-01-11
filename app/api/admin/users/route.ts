import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

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

    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    
    // Remove password from response
    const sanitizedUsers = users.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

