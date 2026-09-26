import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'kopi-mahasiswa-super-secret-jwt-key-2026';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
  name: string;
  branchId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromHeadersOrCookies(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check Cookie header
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, val] = cookie.trim().split('=');
      if (key && val) acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.token) {
      return cookies.token;
    }
  }

  return null;
}

export function getUserFromRequest(req: Request): TokenPayload | null {
  const token = getTokenFromHeadersOrCookies(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function createAuditLog({
  userId,
  action,
  resource,
  details,
  ipAddress,
}: {
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
