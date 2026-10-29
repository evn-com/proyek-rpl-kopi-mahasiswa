import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, createAuditLog } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, phone } = await req.json();
    const identifier = String(email || phone || '').toLowerCase().trim();

    if (!identifier) {
      return NextResponse.json({ error: 'Email atau Nomor WhatsApp wajib diisi.' }, { status: 400 });
    }

    const cleanPhone = identifier.replace(/[^0-9]/g, '');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          cleanPhone.length >= 9 ? { phone: cleanPhone } : {},
          cleanPhone.length >= 9 ? { email: `${cleanPhone}@mahasiswa.kopimahasiswa.local` } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
      include: { role: true, branch: true, profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan. Silakan daftar member terlebih dahulu.' }, { status: 401 });
    }

    // Periksa apakah akun dinonaktifkan oleh Admin
    if (user.passwordHash.startsWith('DISABLED:')) {
      return NextResponse.json(
        { error: 'Akun Anda saat ini dinonaktifkan oleh Administrator. Silakan hubungi staf kafe untuk bantuan.' },
        { status: 403 }
      );
    }

    // Untuk staf (Admin, Kasir, Barista, Owner), verifikasi password wajib cocok
    // Untuk pelanggan/member yang mendaftar via quick-register:
    // dapat login dengan password aslinya, atau default password `kopimhs-${cleanPhone}`, atau langsung jika role Customer
    let isMatch = false;
    if (password) {
      isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch && cleanPhone) {
        isMatch = await comparePassword(`kopimhs-${cleanPhone}`, user.passwordHash);
      }
    } else if (user.role.name === 'Customer') {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Password atau data login tidak sesuai.' }, { status: 401 });
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
        phone: user.phone,
        role: user.role.name,
        points: user.profile?.points || 0,
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
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat login.' }, { status: 500 });
  }
}
