import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/aiService';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    const { messages, mode } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Pesan obrolan tidak boleh kosong.' }, { status: 400 });
    }

    const isLoggedIn = !!user;
    const userName = user?.name || '';

    const reply = await aiService.chat(messages, { isLoggedIn, userName, mode });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({
      reply: 'Halo! Barista AI sedang sibuk meracik pesanan. Ada yang bisa saya bantu terkait pilihan menu kopi favoritmu hari ini?',
    });
  }
}

