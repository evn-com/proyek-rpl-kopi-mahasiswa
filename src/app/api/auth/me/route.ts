import { NextResponse } from 'next/server';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
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
      return NextResponse.json(
        { user: null },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
          branch: user.branch,
          points: user.profile?.points || 0,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { user: null },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (userPayload?.userId) {
      await createAuditLog({
        userId: userPayload.userId,
        action: 'LOGOUT',
        resource: 'USER',
        details: `User ${userPayload.email} logged out successfully.`,
      });
    }
  } catch (err) {
    console.error('[API Logout] Audit log error:', err);
  }

  const response = NextResponse.json(
    { success: true, message: 'Logout berhasil.' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );

  // Hapus cookie token secara bersih dengan nilai kosong dan expired
  response.cookies.set({
    name: 'token',
    value: '',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
