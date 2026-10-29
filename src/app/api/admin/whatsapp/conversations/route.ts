import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import {
  getAllConversationsList,
  getOrCreateConversation,
  markConversationAsRead,
} from '@/lib/whatsapp/handoverService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/whatsapp/conversations
 * Mengambil seluruh daftar percakapan aktif atau detail riwayat pesan per nomor telepon.
 * Otorisasi: Wajib role Admin.
 */
export async function GET(req: Request) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get('phone');

    if (phone) {
      markConversationAsRead(phone);
      const conversation = getOrCreateConversation(phone);
      return NextResponse.json({ conversation });
    }

    const conversations = getAllConversationsList();
    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error fetching whatsapp conversations:', error);
    return NextResponse.json(
      { error: 'Gagal memuat percakapan WhatsApp: ' + error?.message },
      { status: 500 }
    );
  }
}
