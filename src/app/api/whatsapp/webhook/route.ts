/**
 * app/api/whatsapp/webhook/route.ts
 * ──────────────────────────────────────────────────────────────
 * WhatsApp Webhook Handler untuk Fonnte Gateway.
 * Menerima chat masuk dari WhatsApp pelanggan dan membalas otomatis menggunakan
 * AI Barista Kopi Mahasiswa (Gemini / Heuristic Engine) dengan konteks database kafe real-time.
 * 
 * Fitur Keamanan & Handover:
 * 1. Autentikasi Webhook via Secret Token (jika FONNTE_WEBHOOK_SECRET disetel)
 * 2. Idempotency & deduplikasi ganda (Message ID + Content hash)
 * 3. Deteksi & pencegahan loop (pesan keluar dari bot/toko tidak dijawab kembali)
 * 4. Human Handover: Saat status HUMAN_ACTIVE, balasan otomatis AI dinonaktifkan
 * 5. Pencatatan percakapan real-time untuk Inbox Admin
 */

import { NextResponse } from 'next/server';
import { isDuplicateWebhookMessage, processWhatsAppMessage } from '@/lib/ai/baristaBrain';
import { sendWhatsAppMessage } from '@/lib/whatsapp/fonnteClient';
import {
  isMessageAlreadyProcessed,
  isBotActiveForPhone,
  recordCustomerMessage,
  recordBotMessage,
} from '@/lib/whatsapp/handoverService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Format teks Markdown umum (seperti **bold**) agar sesuai dengan gaya WhatsApp (*bold*).
 */
function formatMarkdownForWhatsApp(text: string): string {
  if (!text) return '';
  return text
    // Ubah **bold** atau __bold__ menjadi *bold*
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    .replace(/__(.*?)__/g, '*$1*')
    // Ubah bullet list ### heading menjadi teks tebal dengan emoji
    .replace(/^### (.*$)/gim, '\n*$1*')
    .replace(/^## (.*$)/gim, '\n*$1*')
    .replace(/^# (.*$)/gim, '\n*$1*')
    .trim();
}

/**
 * GET Handler: Untuk pengecekan status webhook (Healthcheck).
 */
export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    service: 'Kopi Mahasiswa WhatsApp Webhook Gateway',
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST Handler: Menerima event pesan masuk dari Fonnte.
 */
export async function POST(req: Request) {
  try {
    // ── 0. Validasi Autentikasi Webhook (jika FONNTE_WEBHOOK_SECRET dikonfigurasi) ──
    const webhookSecret = process.env.FONNTE_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret.trim() !== '') {
      const authHeader = req.headers.get('authorization') || '';
      const url = new URL(req.url);
      const queryToken = url.searchParams.get('token') || '';
      const receivedSecret = authHeader.replace(/^Bearer\s+/i, '') || queryToken;

      if (receivedSecret !== webhookSecret) {
        console.warn('[WhatsApp Webhook] Autentikasi webhook ditolak: secret tidak cocok.');
        return NextResponse.json({ error: 'Unauthorized webhook access' }, { status: 401 });
      }
    }

    let sender = '';
    let message = '';
    let name = '';
    let messageId = '';
    let device = '';
    let fromMe = false;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      sender = body.sender || '';
      message = body.message || '';
      name = body.name || '';
      messageId = body.id || body.message_id || '';
      device = body.device || '';
      fromMe = body.fromMe === true || body.from_me === true;
    } else {
      const formData = await req.formData();
      sender = (formData.get('sender') as string) || '';
      message = (formData.get('message') as string) || '';
      name = (formData.get('name') as string) || '';
      messageId = (formData.get('id') as string) || '';
      device = (formData.get('device') as string) || '';
      fromMe = formData.get('fromMe') === 'true' || formData.get('from_me') === 'true';
    }

    // ── 1. Deteksi Pesan Keluar Sendiri (Loop Prevention) ──
    // Hanya abaikan jika pesan adalah pesan keluar (fromMe === true)
    if (fromMe) {
      return NextResponse.json({
        status: 'ignored',
        reason: 'Pesan keluar dari perangkat sendiri diabaikan untuk mencegah loop',
      });
    }

    if (!sender || !message || message.trim() === '') {
      return NextResponse.json({ status: 'ignored', reason: 'Pesan atau pengirim kosong' });
    }

    const trimmedMsg = message.trim();

    // ── 2. Deduplikasi Message ID Fonnte ──
    if (messageId && isMessageAlreadyProcessed(messageId)) {
      console.warn(`[WhatsApp Webhook] Pesan dengan ID ${messageId} sudah diproses sebelumnya. Mengabaikan retry.`);
      return NextResponse.json({
        status: 'ignored',
        reason: 'Message ID sudah diproses (idempotent)',
      });
    }

    // ── 3. Deduplikasi In-Memory Retry Content ──
    if (isDuplicateWebhookMessage(sender, trimmedMsg)) {
      console.warn(`[WhatsApp Webhook] Pesan duplikat terdeteksi dari ${sender}. Mengabaikan webhook retry.`);
      return NextResponse.json({
        status: 'ignored',
        reason: 'Pesan duplikat terdeteksi dalam jendela waktu webhook retry',
      });
    }

    // ── 4. Catat pesan masuk ke Handover Service ──
    recordCustomerMessage(sender, trimmedMsg, name, messageId);
    console.log(`[WhatsApp Webhook] Pesan masuk dari ${name || sender} (${sender}): "${trimmedMsg}"`);

    // ── 5. Human Handover Check: Apakah Bot Aktif untuk nomor ini? ──
    const botActive = isBotActiveForPhone(sender);
    if (!botActive) {
      console.log(`[WhatsApp Webhook] Percakapan dengan ${sender} sedang dalam mode HUMAN_ACTIVE (ditangani staf). AI dilewati.`);
      return NextResponse.json({
        status: 'human_active',
        message: 'Percakapan sedang ditangani oleh staf manusia. AI tidak mengirim balasan otomatis.',
      });
    }

    // ── 6. Hasilkan Jawaban menggunakan Barista Brain (Database Retrieval & Dynamic Context) ──
    const rawReply = await processWhatsAppMessage(sender, trimmedMsg, name);
    const replyText = formatMarkdownForWhatsApp(rawReply);

    // Catat pesan balasan bot ke Handover Inbox
    recordBotMessage(sender, replyText);

    // ── 7. Kirim Balasan ke WhatsApp ──
    // Kirim via Fonnte Send API secara asinkron (non-blocking) sebagai pengiriman pasti
    sendWhatsAppMessage(sender, replyText).catch((err) => {
      console.warn('[WhatsApp Webhook] Outbound API call error (handled):', err);
    });

    // Fonnte Webhook Protocol: Fonnte membaca properti "reply" di HTTP response JSON
    // untuk langsung mengirimkan balasan otomatis ke pengguna secara instan tanpa delay antrean.
    return NextResponse.json({
      status: 'success',
      reply: replyText,
      message: 'Balasan WhatsApp berhasil diproses oleh AI Barista',
    });
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error saat memproses pesan masuk:', error);
    return NextResponse.json(
      { error: 'Internal server error saat memproses pesan WhatsApp', details: error?.message },
      { status: 500 }
    );
  }
}
