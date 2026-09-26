import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, createAuditLog } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, branch: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      email: user.email,
      name: user.name,
      branchId: user.branchId,
    };

    const token = signToken(tokenPayload);

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'USER',
      details: `User ${user.email} (${user.role.name}) logged in successfully.`,
    });

    const response = NextResponse.json({
      message: 'Login berhasil.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        branch: user.branch?.name || null,
      },
      token,
    });

    // Set HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
