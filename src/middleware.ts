import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kopi-mahasiswa-super-secret-jwt-key-2026'
);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtectedPath =
    path.startsWith('/admin') ||
    path.startsWith('/owner') ||
    path.startsWith('/cashier') ||
    path.startsWith('/barista') ||
    path.startsWith('/profile');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Extract token from cookie or authorization header
  let token = request.cookies.get('token')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized. Silakan login terlebih dahulu.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = (payload.role as string) || '';

    // Check Role Restrictions
    if (path.startsWith('/admin') && userRole !== 'Admin') {
      return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
    }

    if (path.startsWith('/owner') && userRole !== 'Owner') {
      return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
    }

    if (path.startsWith('/cashier') && userRole !== 'Cashier' && userRole !== 'Admin') {
      return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
    }

    if (path.startsWith('/barista') && userRole !== 'Barista' && userRole !== 'Admin') {
      return NextResponse.redirect(new URL('/login?error=forbidden', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Token tidak valid atau telah kadaluarsa.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/cashier/:path*', '/barista/:path*', '/profile/:path*'],
};
