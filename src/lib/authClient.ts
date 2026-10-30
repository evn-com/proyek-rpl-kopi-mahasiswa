/**
 * lib/authClient.ts
 * ──────────────────────────────────────────────────────────────
 * Client-side authentication utilities for Kopi Mahasiswa.
 * Handles clean logout, token removal, and storage synchronization.
 */

export async function clientLogout(targetUrl: string = '/login'): Promise<void> {
  try {
    // 1. Panggil endpoint logout di server untuk menghapus HTTP-only cookie
    await fetch('/api/auth/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[clientLogout] Server logout error:', err);
  }

  // 2. Hapus sisa-sisa cookie di client (jika ada non-httpOnly cookie)
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;';
  }

  // 3. Bersihkan localStorage & sessionStorage dari data sesi pengguna
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      sessionStorage.clear();
    } catch (storageErr) {
      console.warn('[clientLogout] Storage cleanup warning:', storageErr);
    }

    // 4. Hard redirect (full reload) untuk membersihkan seluruh state React dari memori
    window.location.href = targetUrl;
  }
}
