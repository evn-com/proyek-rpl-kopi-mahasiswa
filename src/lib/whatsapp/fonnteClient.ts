/**
 * lib/whatsapp/fonnteClient.ts
 * ──────────────────────────────────────────────────────────────
 * WhatsApp Client Service menggunakan Fonnte API.
 * Mendukung normalisasi nomor Indonesia dan pengiriman pesan notifikasi otomatis.
 */

const FONNTE_API_URL = 'https://api.fonnte.com/send';

/**
 * Normalisasi nomor HP ke format internasional Fonnte (contoh: 628xxxxxxxxxx).
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Hapus semua karakter non-angka dan suffix WhatsApp
  let cleaned = phone.replace(/@.*$/, '').replace(/[^0-9]/g, '');

  // Ubah awalan 08xxx menjadi 628xxx
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  
  // Jika diawali 8xxx, tambahkan 62
  if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

export interface SendMessageResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Mengirim pesan WhatsApp melalui Fonnte API.
 */
export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string
): Promise<SendMessageResult> {
  const token = process.env.FONNTE_TOKEN;

  if (!token || token.trim() === '') {
    console.warn('[WhatsApp Fonnte] FONNTE_TOKEN belum disetel di .env. Pengiriman pesan dibatalkan.');
    return { success: false, error: 'FONNTE_TOKEN belum dikonfigurasi di file .env' };
  }

  const formattedTarget = formatPhoneNumber(targetPhone);
  if (!formattedTarget || formattedTarget.length < 9) {
    return { success: false, error: `Nomor telepon tujuan tidak valid: "${targetPhone}"` };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('target', formattedTarget);
    formData.append('message', message);
    formData.append('countryCode', '62');

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.status === false) {
      console.error('[WhatsApp Fonnte] Gagal mengirim pesan:', result);
      return {
        success: false,
        error: result.reason || result.message || 'Gagal mengirim pesan via Fonnte',
        data: result,
      };
    }

    return {
      success: true,
      message: 'Pesan WhatsApp berhasil dikirim',
      data: result,
    };
  } catch (error: any) {
    console.error('[WhatsApp Fonnte] Network Error:', error);
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan jaringan saat menghubungi server Fonnte',
    };
  }
}

/**
 * Helper: Notifikasi Pesanan Baru Berhasil Dibuat
 */
export async function notifyOrderCreatedWA(order: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  tableNumber: string;
  finalAmount: number;
  paymentMethod: string;
  items?: Array<{ productName: string; quantity: number; variantName?: string | null }>;
}) {
  if (!order.customerPhone) return null;

  const itemListText = order.items && order.items.length > 0
    ? order.items.map((i) => `• ${i.productName} (${i.quantity}x)`).join('\n')
    : '';

  const paymentDesc = order.paymentMethod === 'ONLINE_PAYMENT' ? 'Online / QRIS' : 'Bayar di Kasir';

  const message =
`☕ *Kopi Mahasiswa — Pesanan Diterima!*

Halo kak *${order.customerName}*, terima kasih telah memesan di Kopi Mahasiswa!

📋 *Detail Pesanan:*
• No. Pesanan: *#${order.orderNumber}*
• Meja: *${order.tableNumber}*
• Metode Bayar: *${paymentDesc}*
• Total: *Rp ${order.finalAmount.toLocaleString('id-ID')}*

${itemListText ? `🛒 *Menu yang Dipesan:*\n${itemListText}\n\n` : ''}Status pesanan Anda saat ini sedang menunggu konfirmasi kasir & barista. Kami akan kabari jika pesanan sudah siap diambil. Selamat menikmati! ✨`;

  return await sendWhatsAppMessage(order.customerPhone, message);
}

/**
 * Helper: Notifikasi Pesanan Siap Disajikan / Diambil
 */
export async function notifyOrderReadyWA(order: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  tableNumber: string;
}) {
  if (!order.customerPhone) return null;

  const message =
`🎉 *Pesanan Siap! — Kopi Mahasiswa*

Halo kak *${order.customerName}*!
Pesanan Anda *#${order.orderNumber}* untuk *${order.tableNumber}* sudah selesai diracik dan siap disajikan/diambil di konter barista. ☕✨

Silakan tunjukkan pesan atau nomor pesanan ini ke barista ya. Selamat menikmati kopi racikan terbaik kami! 😊`;

  return await sendWhatsAppMessage(order.customerPhone, message);
}

/**
 * Helper: Notifikasi Pembayaran Berhasil Dikonfirmasi
 */
export async function notifyPaymentSuccessWA(order: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  finalAmount: number;
}) {
  if (!order.customerPhone) return null;

  const message =
`✅ *Pembayaran Terkonfirmasi — Kopi Mahasiswa*

Halo kak *${order.customerName}*, pembayaran untuk pesanan *#${order.orderNumber}* sejumlah *Rp ${order.finalAmount.toLocaleString('id-ID')}* telah berhasil kami terima.

Barista kami sedang menyiapkan pesanan Anda dengan sepenuh hati. Mohon tunggu sebentar ya! ☕`;

  return await sendWhatsAppMessage(order.customerPhone, message);
}

import {
  formatMembershipApprovedMessage,
  formatDailyPromoMessage,
  formatOptOutConfirmationMessage,
  formatOptInConfirmationMessage,
  DailyPromoParams,
} from './templates';

/**
 * Helper: Notifikasi Persetujuan Membership Resmi
 */
export async function sendMembershipApprovedWA(
  phone: string,
  name: string
): Promise<SendMessageResult> {
  const message = formatMembershipApprovedMessage({ name });
  return await sendWhatsAppMessage(phone, message);
}

/**
 * Helper: Pengiriman Promo Harian
 */
export async function sendDailyPromoWA(
  phone: string,
  params: DailyPromoParams
): Promise<SendMessageResult> {
  const message = formatDailyPromoMessage(params);
  return await sendWhatsAppMessage(phone, message);
}

/**
 * Helper: Konfirmasi Opt-out Notifikasi Promo
 */
export async function sendPromoOptOutWA(phone: string, name?: string): Promise<SendMessageResult> {
  const message = formatOptOutConfirmationMessage(name);
  return await sendWhatsAppMessage(phone, message);
}

/**
 * Helper: Konfirmasi Opt-in Notifikasi Promo
 */
export async function sendPromoOptInWA(phone: string, name?: string): Promise<SendMessageResult> {
  const message = formatOptInConfirmationMessage(name);
  return await sendWhatsAppMessage(phone, message);
}
