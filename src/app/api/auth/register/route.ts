import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, createAuditLog } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, name, phone } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 400 });
    }

    const customerRole = await prisma.role.findUnique({
      where: { name: 'Customer' },
    });

    if (!customerRole) {
      return NextResponse.json({ error: 'Role Customer tidak ditemukan.' }, { status: 500 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        name,
        phone,
        roleId: customerRole.id,
        isGuest: false,
        profile: {
          create: {
            points: 50, // Welcome points!
          },
        },
      },
      include: { role: true },
    });

    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      email: user.email,
      name: user.name,
    };

    const token = signToken(tokenPayload);

    await createAuditLog({
      userId: user.id,
      action: 'REGISTER_SUCCESS',
      resource: 'USER',
      details: `New customer registered: ${user.email}`,
    });

    const response = NextResponse.json({
      message: 'Pendaftaran berhasil. Selamat datang di Kopi Mahasiswa!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
      token,
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat pendaftaran.' }, { status: 500 });
  }
}
