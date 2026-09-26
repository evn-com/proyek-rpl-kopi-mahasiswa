import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/aiService';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Pesan obrolan tidak boleh kosong.' }, { status: 400 });
    }

    const reply = await aiService.chat(messages);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({
      reply: 'Halo! Barista AI sedang sibuk meracik pesanan. Ada yang bisa saya bantu terkait pilihan menu kopi favoritmu hari ini?',
    });
  }
}
