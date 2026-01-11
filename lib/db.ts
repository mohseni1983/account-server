import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'vpn-share.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile TEXT NOT NULL UNIQUE,
    national_id TEXT NOT NULL UNIQUE,
    referrer_name TEXT NOT NULL,
    tracking_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    username TEXT,
    password TEXT,
    profile_file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tracking_code ON users(tracking_code);
  CREATE INDEX IF NOT EXISTS idx_mobile ON users(mobile);
  CREATE INDEX IF NOT EXISTS idx_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_platform ON client_files(platform);
`);

// Create default admin if not exists
try {
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminExists.count === 0) {
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', defaultPassword);
    console.log('Default admin created: username=admin, password=admin123');
  }
} catch (error) {
  // Admin might already exist, ignore error
  console.log('Admin initialization skipped');
}

export default db;

