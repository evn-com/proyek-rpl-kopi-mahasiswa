import { NextResponse } from 'next/server';
import { getUserFromRequest, TokenPayload } from './auth';

/**
 * Validates whether the incoming request has a valid token.
 */
export function requireAuth(req: Request): { user: TokenPayload } | { errorResponse: NextResponse } {
  const user = getUserFromRequest(req);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Validates whether the user has one of the allowed roles.
 */
export function requireRole(
  req: Request,
  allowedRoles: string[]
): { user: TokenPayload } | { errorResponse: NextResponse } {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) {
    return auth;
  }

  const normalizedUserRole = (auth.user.role || '').toLowerCase();
  const isAllowed = allowedRoles.some((r) => r.toLowerCase() === normalizedUserRole);

  if (!isAllowed) {
    return {
      errorResponse: NextResponse.json(
        { error: `Akses ditolak. Role "${auth.user.role}" tidak memiliki izin.` },
        { status: 403 }
      ),
    };
  }

  return { user: auth.user };
}

/**
 * Enforces Read-Only constraint for Owner on mutative requests (POST, PUT, PATCH, DELETE).
 * Returns true if the request was blocked with 403 Forbidden.
 */
export function blockIfOwnerWrite(req: Request): NextResponse | null {
  const user = getUserFromRequest(req);
  if (user?.role === 'Owner') {
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return NextResponse.json(
        {
          error: 'Akses Ditolak: Akun Owner bersifat READ-ONLY dan tidak diizinkan melakukan perubahan operasional.',
          isReadOnly: true,
        },
        { status: 403 }
      );
    }
  }
  return null;
}

/**
 * Basic XSS sanitization helper for user-supplied string inputs.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // remove HTML tag brackets
    .trim();
}
