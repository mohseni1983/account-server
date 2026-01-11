import path from 'path';
import fs from 'fs';

export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomPath(): string {
  const segments: string[] = [];
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  // Generate 3-4 nested folder segments
  const numSegments = Math.floor(Math.random() * 2) + 3; // 3 or 4 segments
  
  for (let i = 0; i < numSegments; i++) {
    let segment = '';
    const segmentLength = Math.floor(Math.random() * 5) + 8; // 8-12 chars
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  // Generate random filename
  let filename = '';
  const filenameLength = Math.floor(Math.random() * 10) + 15; // 15-24 chars
  for (let i = 0; i < filenameLength; i++) {
    filename += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  filename += '.ovpn';
  
  return path.join(...segments, filename);
}

export function createProfileFile(trackingCode: string, masterProfilePath: string): string {
  const profilesDir = path.join(process.cwd(), 'data', 'profiles');
  
  // Ensure profiles directory exists
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  
  // Generate random nested path
  const relativePath = generateRandomPath();
  const fullPath = path.join(profilesDir, relativePath);
  const fullDir = path.dirname(fullPath);
  
  // Create nested directories
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
  
  // Copy master profile to new location
  if (!fs.existsSync(masterProfilePath)) {
    throw new Error('Master profile file not found');
  }
  
  fs.copyFileSync(masterProfilePath, fullPath);
  
  // Return relative path from profiles directory
  return relativePath;
}

export function getProfileFilePath(relativePath: string): string {
  return path.join(process.cwd(), 'data', 'profiles', relativePath);
}

