/**
 * lib/ai/aiConfig.ts
 * ──────────────────────────────────────────────────────────────
 * Helper terpusat untuk mengambil model AI aktif dan API Key dinamis
 * yang tersimpan di database (Setting table) dengan fallback ke file .env.
 */

import { prisma } from '@/lib/prisma';

export type AIProvider = 'gemini' | 'grok';
export type AIModelType = 'gemini' | 'grok';

/**
 * Mengambil API Key efektif untuk provider tertentu.
 * Prioritas:
 * 1. Database Setting `ai_api_key_{provider}`
 * 2. Environment variable (.env)
 */
export async function getEffectiveApiKey(provider: AIProvider): Promise<string> {
  try {
    const settingDelegate = (prisma as any).setting;
    if (settingDelegate) {
      const record = await settingDelegate.findUnique({
        where: { key: `ai_api_key_${provider}` },
      });
      if (record?.value && record.value.trim().length > 0) {
        return record.value.trim();
      }
    }
  } catch (err) {
    // Database query failed, fallback to env
  }

  // Fallback ke environment variable
  switch (provider) {
    case 'gemini':
      return process.env.GEMINI_API_KEY || '';
    case 'grok':
      return process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
    default:
      return '';
  }
}

/**
 * Mengambil active AI model dari database. Default: 'gemini'
 */
export async function getActiveAiModel(): Promise<AIModelType> {
  try {
    const settingDelegate = (prisma as any).setting;
    if (settingDelegate) {
      const record = await settingDelegate.findUnique({
        where: { key: 'active_ai_model' },
      });
      if (record?.value) {
        const val = record.value.toLowerCase();
        if (['gemini', 'grok'].includes(val)) {
          return val as AIModelType;
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return 'gemini';
}

/**
 * Cek apakah provider tertentu memiliki API key yang valid
 */
export async function isProviderConfigured(provider: AIProvider): Promise<boolean> {
  const key = await getEffectiveApiKey(provider);
  return Boolean(key && key.length >= 8 && !key.includes('invalid'));
}

