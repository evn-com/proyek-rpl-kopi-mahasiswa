import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/auth';
import { sendMembershipApprovedWA, formatPhoneNumber } from '@/lib/whatsapp/fonnteClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/memberships/[id]/approve
 * Menyetujui pendaftaran membership mahasiswa.
 * Otorisasi: Wajib role Admin.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;

  try {
    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Data pendaftaran membership tidak ditemukan.' }, { status: 404 });
    }

    if (membership.status === 'APPROVED') {
      return NextResponse.json({
        message: 'Membership ini sudah disetujui sebelumnya.',
        membership,
      });
    }

    // 1. Simpan perubahan status ke APPROVED di database terlebih dahulu
    const updatedMembership = await prisma.membership.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: auth.user.userId,
        rejectionReason: null,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    // Berikan poin bonus membership (50 poin) jika belum terisi
    if (updatedMembership.user.profile) {
      if (updatedMembership.user.profile.points < 50) {
        await prisma.customerProfile.update({
          where: { id: updatedMembership.user.profile.id },
          data: { points: 50 },
        });
      }
    } else {
      await prisma.customerProfile.create({
        data: {
          userId: updatedMembership.user.id,
          points: 50,
        },
      });
    }

    // 2. Kirim Notifikasi WhatsApp Persetujuan (HANYA setelah persetujuan sukses di DB)
    let waStatus = updatedMembership.whatsappNotificationStatus;
    let waError: string | null = null;
    let waNotifiedAt: Date | null = null;

    const userPhone = updatedMembership.user.phone;
    const formattedPhone = formatPhoneNumber(userPhone || '');

    // Cek persetujuan WhatsApp pelanggan & pastikan belum pernah terkirim (idempotency)
    if (!updatedMembership.whatsappConsent) {
      waStatus = 'SKIPPED';
      waError = 'Pelanggan tidak memberikan persetujuan menerima pesan WhatsApp saat registrasi.';
    } else if (waStatus === 'SENT') {
      // Sudah terkirim sebelumnya, jangan kirim duplikat
      console.log(`[Membership Approval] Notifikasi WA untuk ${userPhone} sudah terkirim sebelumnya.`);
    } else if (!formattedPhone || formattedPhone.length < 9) {
      waStatus = 'FAILED';
      waError = 'Nomor WhatsApp pelanggan tidak valid.';
    } else {
      // Panggil Fonnte API
      const sendResult = await sendMembershipApprovedWA(
        formattedPhone,
        updatedMembership.user.name
      );

      if (sendResult.success) {
        waStatus = 'SENT';
        waNotifiedAt = new Date();
        waError = null;
      } else {
        waStatus = 'FAILED';
        waError = sendResult.error || 'Gagal mengirim pesan via WhatsApp Gateway';
      }
    }

    // Simpan status notifikasi WhatsApp ke database
    const finalMembership = await prisma.membership.update({
      where: { id },
      data: {
        whatsappNotificationStatus: waStatus,
        whatsappNotificationError: waError,
        whatsappNotifiedAt: waNotifiedAt,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    // Audit log
    await createAuditLog({
      userId: auth.user.userId,
      action: 'APPROVE_MEMBERSHIP',
      resource: 'MEMBERSHIP',
      details: `Admin menyetujui membership user: ${updatedMembership.user.name} (${userPhone}) - WA Status: ${waStatus}`,
    });

    return NextResponse.json({
      success: true,
      message: `Membership ${updatedMembership.user.name} berhasil disetujui.${
        waStatus === 'SENT'
          ? ' Notifikasi WhatsApp telah terkirim.'
          : waStatus === 'SKIPPED'
          ? ' Notifikasi dilewati (opt-out).'
          : ' Notifikasi WhatsApp gagal terkirim (dapat dicoba kirim ulang).'
      }`,
      membership: finalMembership,
    });
  } catch (error: any) {
    console.error('Error approving membership:', error);
    return NextResponse.json(
      { error: 'Gagal memproses persetujuan membership', details: error?.message },
      { status: 500 }
    );
  }
}
