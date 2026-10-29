import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, createAuditLog } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, campus, email, password } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nama Lengkap dan Nomor Telepon/WhatsApp wajib diisi.' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return NextResponse.json({ error: 'Nomor WhatsApp tidak valid (minimal 9 digit angka).' }, { status: 400 });
    }

    // Auto-generate identifier email jika pelanggan tidak mengisi email
    const generatedEmail = email
      ? email.toLowerCase().trim()
      : `${cleanPhone}@mahasiswa.kopimahasiswa.local`;

    const generatedPassword = password || `kopimhs-${cleanPhone}`;

    // Cek apakah nomor atau email sudah terdaftar
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: generatedEmail },
          { phone: cleanPhone },
          { phone: phone.trim() },
        ],
      },
      include: { role: true, profile: true, membership: true },
    });

    const customerRole = await prisma.role.findUnique({
      where: { name: 'Customer' },
    });

    if (!customerRole) {
      return NextResponse.json({ error: 'Role Customer tidak ditemukan.' }, { status: 500 });
    }

    let user = existingUser;

    if (!user) {
      const hashedPassword = await hashPassword(generatedPassword);

      const whatsappConsent = body.whatsappConsent !== false;
      const promoConsent = body.promoConsent !== false;

      user = await prisma.user.create({
        data: {
          email: generatedEmail,
          passwordHash: hashedPassword,
          name: name.trim(),
          phone: cleanPhone,
          roleId: customerRole.id,
          isGuest: false,
          profile: {
            create: {
              points: 0, // Bonus 50 Poin akan aktif setelah disetujui Admin
            },
          },
          membership: {
            create: {
              campus: campus ? String(campus).trim() : null,
              status: 'PENDING',
              whatsappConsent,
              promoConsent,
              whatsappNotificationStatus: 'PENDING',
            },
          },
        },
        include: { role: true, profile: true, membership: true },
      });

      // Buat / pastikan voucher diskon 10% member aktif di database
      try {
        await prisma.voucher.upsert({
          where: { code: 'MEMBER10' },
          update: { isActive: true },
          create: {
            code: 'MEMBER10',
            discountType: 'PERCENTAGE',
            discountAmount: 10,
            minSpend: 0,
            quota: 99999,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
          },
        });
      } catch (e) {
        console.warn('Voucher initialization note:', e);
      }

      await createAuditLog({
        userId: user.id,
        action: 'REGISTER_MEMBERSHIP_PENDING',
        resource: 'MEMBERSHIP',
        details: `Pendaftaran membership diajukan (PENDING): ${user.name} (${user.phone}) - Kampus: ${campus || '-'}`,
      });
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role.name,
      email: user.email,
      name: user.name,
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Pendaftaran membership berhasil diajukan dan sedang menunggu persetujuan Admin.',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role.name,
        points: user.profile?.points || 0,
        membershipStatus: user.membership?.status || 'PENDING',
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
    return NextResponse.json({ error: 'Terjadi kesalahan saat pendaftaran member.' }, { status: 500 });
  }
}
