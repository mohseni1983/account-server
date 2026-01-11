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

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const platform = formData.get('platform') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!file || !platform || !name) {
      return NextResponse.json(
        { error: 'فایل، پلتفرم و نام الزامی است' },
        { status: 400 }
      );
    }

    // Create client files directory
    const clientFilesDir = path.join(process.cwd(), 'data', 'client-files');
    if (!fs.existsSync(clientFilesDir)) {
      fs.mkdirSync(clientFilesDir, { recursive: true });
    }

    // Generate unique filename
    const fileExt = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = path.join(clientFilesDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Save to database
    const result = db
      .prepare(
        'INSERT INTO client_files (platform, name, file_path, file_size, description) VALUES (?, ?, ?, ?, ?)'
      )
      .run(platform, name, fileName, file.size, description || null);

    return NextResponse.json({
      success: true,
      file: {
        id: result.lastInsertRowid,
        platform,
        name,
        file_size: file.size,
        description: description || null,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}

