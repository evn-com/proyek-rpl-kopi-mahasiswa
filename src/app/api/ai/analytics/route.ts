import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/aiService';
import { requireRole } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ['Admin', 'Owner']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get('days') || '30', 10);

    const insights = await aiService.getAnalyticsInsights(periodDays);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching AI analytics insights:', error);
    return NextResponse.json({ error: 'Gagal memuat analitik kecerdasan buatan' }, { status: 500 });
  }
}
