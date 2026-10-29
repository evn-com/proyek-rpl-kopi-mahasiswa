/**
 * lib/ai/rateLimiter.ts
 * ─────────────────────────────────────────────────────────────
 * In-Memory Rate Limiter — no external dependency (no Redis/Upstash needed).
 * Menggunakan sliding-window counter per identitas pengguna (userId atau IP).
 *
 * Default: 10 request / 60 detik per pengguna.
 * Expired entries dibersihkan otomatis setiap 5 menit agar memori tidak bocor.
 */

interface BucketEntry {
  count: number;
  windowStart: number; // epoch ms
}

// In-memory store: key → { count, windowStart }
const store = new Map<string, BucketEntry>();

/** Konfigurasi rate-limit */
export const RATE_LIMIT_CONFIG = {
  /** Jumlah maksimal request yang diizinkan dalam satu window */
  maxRequests: 10,
  /** Durasi window dalam milidetik (default 60 detik) */
  windowMs: 60_000,
  /** Panjang maksimal karakter pesan pengguna */
  maxInputChars: 500,
};

/**
 * Cleanup entry yang sudah expired.
 * Dipanggil secara periodik agar store tidak membengkak di production.
 */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > RATE_LIMIT_CONFIG.windowMs) {
      store.delete(key);
    }
  }
}

// Jalankan cleanup setiap 5 menit
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 5 * 60_000);
}

export interface RateLimitResult {
  /** true jika request diizinkan */
  allowed: boolean;
  /** Sisa request yang masih diizinkan dalam window ini */
  remaining: number;
  /** Waktu (detik) hingga window reset */
  resetInSeconds: number;
}

/**
 * Periksa dan catat satu request untuk identifier tertentu.
 * @param identifier - userId atau IP address pengguna
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const { maxRequests, windowMs } = RATE_LIMIT_CONFIG;

  const entry = store.get(identifier);

  // Jika tidak ada entry atau window sudah expired → buat/reset entry
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Window masih aktif
  if (entry.count >= maxRequests) {
    const resetInSeconds = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Increment counter
  entry.count += 1;
  store.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetInSeconds: Math.ceil((windowMs - (now - entry.windowStart)) / 1000),
  };
}

/**
 * Ekstrak identifier yang digunakan sebagai kunci rate limit.
 * Prioritas: userId (jika login) → IP address header → fallback "anonymous"
 */
export function extractIdentifier(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;

  // Coba baca IP dari berbagai header proxy
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return `ip:${forwarded.split(',')[0].trim()}`;

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp}`;

  return 'ip:anonymous';
}
