/**
 * lib/whatsapp/templates.ts
 * ──────────────────────────────────────────────────────────────
 * Template Pesan Resmi WhatsApp untuk Kopi Mahasiswa.
 * Mengikuti pedoman WhatsApp Business Platform & Fonnte Gateway.
 */

export interface MembershipApprovedParams {
  name: string;
}

export interface DailyPromoParams {
  name: string;
  promoTitle: string;
  promoDetail: string;
  period: string;
}

/**
 * Template Pesan: Persetujuan Membership Kopi Mahasiswa
 * Format:
 * "Halo {{nama}}, selamat! Pendaftaran membership Kopi Mahasiswa kamu telah disetujui. Kamu sekarang dapat menikmati manfaat membership sesuai ketentuan yang berlaku. Terima kasih telah bergabung!"
 */
export function formatMembershipApprovedMessage(params: MembershipApprovedParams): string {
  const cleanName = params.name.trim() || 'Kak';
  return `Halo *${cleanName}*, selamat! Pendaftaran membership Kopi Mahasiswa kamu telah disetujui. Kamu sekarang dapat menikmati manfaat membership sesuai ketentuan yang berlaku. Terima kasih telah bergabung! ☕🎉

*Manfaat Member Kamu:*
• Diskon 10% di setiap pemesanan (Kode: *MEMBER10*)
• Bonus 50 Poin Loyalitas Mahasiswa
• Akses promo khusus dan racikan eksklusif

Selamat menikmati kopi favoritmu di kedai kami! ✨`;
}

/**
 * Template Pesan: Notifikasi Promo Harian Kopi Mahasiswa
 * Format:
 * "Halo {{nama}}! Berikut promo Kopi Mahasiswa yang aktif hari ini: {{nama_promo}}. {{detail_promo}}. Berlaku {{periode}}. Syarat dan ketentuan berlaku. Balas STOP jika tidak ingin menerima informasi promosi lagi."
 */
export function formatDailyPromoMessage(params: DailyPromoParams): string {
  const cleanName = params.name.trim() || 'Sobat Mahasiswa';
  return `Halo *${cleanName}*! Berikut promo Kopi Mahasiswa yang aktif hari ini: *${params.promoTitle}*. ${params.promoDetail}. Berlaku *${params.period}*. Syarat dan ketentuan berlaku. ☕🔥

Pesan sekarang di kedai atau via website: https://kopimahasiswa.id

_Balas STOP jika tidak ingin menerima informasi promosi lagi._`;
}

/**
 * Template Pesan: Konfirmasi Berhenti Berlangganan Promo (Opt-out)
 */
export function formatOptOutConfirmationMessage(name?: string): string {
  const cleanName = name?.trim() || 'Kak';
  return `Halo *${cleanName}*, permintaanmu telah kami catat. Kamu telah berhasil berhenti berlangganan (opt-out) dari notifikasi promosi harian Kopi Mahasiswa.

Kamu tetap dapat menikmati layanan dan menanyakan info menu, meja, atau pesanan kapan saja. Balas PROMO ON jika ingin berlangganan kembali di masa depan. Terima kasih! 🙏☕`;
}

/**
 * Template Pesan: Konfirmasi Berlangganan Kembali Promo (Opt-in)
 */
export function formatOptInConfirmationMessage(name?: string): string {
  const cleanName = name?.trim() || 'Kak';
  return `Halo *${cleanName}*, terima kasih! Kamu telah kembali mengaktifkan notifikasi promo Kopi Mahasiswa. Kami akan mengabari kamu jika ada promo atau voucher menarik untuk nugas hemat! ☕🎉`;
}
