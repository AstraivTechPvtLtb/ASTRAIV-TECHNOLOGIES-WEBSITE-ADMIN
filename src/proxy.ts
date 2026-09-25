import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretKey } from '@/lib/jwt';

/**
 * Next.js 16 Edge proxy to enforce strict JWT authentication across all admin portal routes.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessTokenCookie = request.cookies.get('astraiv_admin_access_token')?.value;
  const refreshTokenCookie = request.cookies.get('astraiv_admin_refresh_token')?.value;
  const _legacySessionCookie = request.cookies.get('astraiv_admin_session')?.value;

  let isAuthenticated = false;

  // 1. Verify JWT Access Token (60 days)
  if (accessTokenCookie) {
    try {
      const secret = getJwtSecretKey();
      const { payload } = await jwtVerify(accessTokenCookie, secret, {
        algorithms: ['HS256'],
      });
      if (payload.tokenType === 'access' && payload.role === 'ADMIN') {
        isAuthenticated = true;
      }
    } catch {
      // Access token expired or invalid; fall through to refresh token verification
    }
  }

  // 2. If access token is expired, verify JWT Refresh Token (30 days)
  if (!isAuthenticated && refreshTokenCookie) {
    try {
      const secret = getJwtSecretKey();
      const { payload } = await jwtVerify(refreshTokenCookie, secret, {
        algorithms: ['HS256'],
      });
      if (payload.tokenType === 'refresh') {
        isAuthenticated = true;
      }
    } catch {
      // Refresh token expired or invalid
    }
  }


  // Root path redirects to /dashboard if logged in, or /login if not
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('astraiv_admin_access_token');
    response.cookies.delete('astraiv_admin_refresh_token');
    response.cookies.delete('astraiv_admin_session');
    return response;
  }

  // Login page: displays login screen
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Protected administrative routes
  const protectedPrefixes = [
    '/dashboard',
    '/analytics',
    '/enquiries',
    '/reviews',
    '/projects',
    '/services',
    '/footer',
    '/blog',
    '/settings',
    '/recruitment',
    '/pricing',
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Backward-compatible named export
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
