import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/aiService';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    const recommendations = await aiService.getRecommendations(userPayload?.userId || null);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return NextResponse.json({ recommendations: [] });
  }
}
