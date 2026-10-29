/**
 * lib/whatsapp/dailyPromoService.ts
 * ──────────────────────────────────────────────────────────────
 * Layanan Pengiriman Promo Harian Kopi Mahasiswa via WhatsApp.
 * Mengikuti:
 * 1. Zona waktu Asia/Jakarta (WIB)
 * 2. Idempotency harian via PromoBroadcastLog (@@unique([broadcastDate, targetPhone]))
 * 3. Filter ketat hanya member dengan persetujuan (promoConsent = true & status = APPROVED)
 * 4. Pengecekan promo aktif dari database (tanpa promo palsu/kedaluwarsa)
 * 5. Template pesan WhatsApp resmi dengan instruksi STOP opt-out
 */

import { prisma } from '../prisma';
import { sendDailyPromoWA, formatPhoneNumber } from './fonnteClient';
import { formatDailyPromoMessage } from './templates';

export interface DailyPromoRunResult {
  success: boolean;
  broadcastDate: string;
  promoTitle?: string;
  totalEligible: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  reason?: string;
  details: Array<{
    phone: string;
    name: string;
    status: 'SENT' | 'SKIPPED' | 'FAILED';
    error?: string;
  }>;
}

/**
 * Mendapatkan string tanggal hari ini berdasarkan zona waktu Asia/Jakarta (format: YYYY-MM-DD)
 */
export function getJakartaDateString(date: Date = new Date()): string {
  // en-CA format menghasilkan format standar ISO YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Menjalankan broadcast promo harian ke pelanggan yang telah opt-in
 */
export async function runDailyPromoBroadcast(): Promise<DailyPromoRunResult> {
  const broadcastDate = getJakartaDateString();
  const now = new Date();

  // 1. Ambil promo aktif yang valid saat ini di database
  const activePromo = await prisma.promotion.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Jika tidak ada promo aktif, jangan kirim pesan promo palsu
  if (!activePromo) {
    return {
      success: false,
      broadcastDate,
      totalEligible: 0,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
      reason: 'Tidak ada promo aktif yang valid di database untuk hari ini.',
      details: [],
    };
  }

  // Cari voucher aktif yang relevan sebagai pemanis promo jika ada
  const activeVoucher = await prisma.voucher.findFirst({
    where: {
      isActive: true,
      expiryDate: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  const discInfo = activePromo.discountType === 'PERCENTAGE'
    ? `Diskon ${activePromo.discountValue || activePromo.discountPercent}%`
    : `Potongan Rp ${activePromo.discountValue.toLocaleString('id-ID')}`;

  const voucherNote = activeVoucher ? ` Gunakan kode voucher ${activeVoucher.code} saat checkout.` : '';
  const promoDetail = `${activePromo.description} (${discInfo}).${voucherNote}`;

  const periodStr = `${activePromo.startDate.toISOString().slice(0, 10)} s/d ${activePromo.endDate.toISOString().slice(0, 10)}`;

  // 2. Ambil seluruh member yang telah memberikan persetujuan (promoConsent = true) dan status APPROVED
  const eligibleMembers = await prisma.membership.findMany({
    where: {
      status: 'APPROVED',
      promoConsent: true,
      user: {
        phone: { not: null },
      },
    },
    include: {
      user: true,
    },
  });

  const result: DailyPromoRunResult = {
    success: true,
    broadcastDate,
    promoTitle: activePromo.title,
    totalEligible: eligibleMembers.length,
    sentCount: 0,
    skippedCount: 0,
    failedCount: 0,
    details: [],
  };

  for (const member of eligibleMembers) {
    const rawPhone = member.user.phone || '';
    const formattedPhone = formatPhoneNumber(rawPhone);

    if (!formattedPhone || formattedPhone.length < 9) {
      result.skippedCount++;
      result.details.push({
        phone: rawPhone,
        name: member.user.name,
        status: 'SKIPPED',
        error: 'Nomor telepon tidak valid',
      });
      continue;
    }

    // 3. Cek Idempotency: Apakah nomor ini sudah dikirim promo pada tanggal yang sama?
    const existingLog = await prisma.promoBroadcastLog.findUnique({
      where: {
        broadcastDate_targetPhone: {
          broadcastDate,
          targetPhone: formattedPhone,
        },
      },
    });

    if (existingLog) {
      result.skippedCount++;
      result.details.push({
        phone: formattedPhone,
        name: member.user.name,
        status: 'SKIPPED',
        error: `Sudah dikirim pada tanggal ${broadcastDate} (Idempotent)`,
      });
      continue;
    }

    // 4. Kirim Pesan Promo WhatsApp
    const messageParams = {
      name: member.user.name,
      promoTitle: activePromo.title,
      promoDetail,
      period: periodStr,
    };

    const sendRes = await sendDailyPromoWA(formattedPhone, messageParams);
    const messageText = formatDailyPromoMessage(messageParams);

    // 5. Catat Log ke Database
    try {
      await prisma.promoBroadcastLog.create({
        data: {
          broadcastDate,
          targetPhone: formattedPhone,
          userId: member.user.id,
          promotionId: activePromo.id,
          status: sendRes.success ? 'SENT' : 'FAILED',
          errorMessage: sendRes.error || null,
          messageText,
        },
      });
    } catch (dbErr) {
      console.warn('[Daily Promo] Gagal menyimpan broadcast log:', dbErr);
    }

    if (sendRes.success) {
      result.sentCount++;
      result.details.push({
        phone: formattedPhone,
        name: member.user.name,
        status: 'SENT',
      });
    } else {
      result.failedCount++;
      result.details.push({
        phone: formattedPhone,
        name: member.user.name,
        status: 'FAILED',
        error: sendRes.error,
      });
    }
  }

  return result;
}
