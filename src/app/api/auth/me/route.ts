import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: { select: { name: true } },
        branch: { select: { id: true, name: true, code: true } },
        profile: { select: { points: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        branch: user.branch,
        points: user.profile?.points || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}

export async function POST(req: Request) {
  // Logout route
  const response = NextResponse.json({ message: 'Logout berhasil.' });
  response.cookies.delete('token');
  return response;
}
