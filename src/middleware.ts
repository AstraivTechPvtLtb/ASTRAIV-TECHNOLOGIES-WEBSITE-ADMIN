import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge middleware to enforce strict authentication across all admin portal routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSessionCookie = request.cookies.get('astraiv_admin_session');
  const hasSession = Boolean(adminSessionCookie?.value);

  // Root path ALWAYS redirects to /login so credentials are required on start
  if (pathname === '/') {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('astraiv_admin_session');
    return response;
  }

  // Login page always displays the login screen and clears any prior lingering session
  if (pathname === '/login') {
    const response = NextResponse.next();
    if (request.method === 'GET' && hasSession) {
      response.cookies.delete('astraiv_admin_session');
    }
    return response;
  }


  // Protected administrative routes
  const protectedPrefixes = [
    '/dashboard',
    '/enquiries',
    '/reviews',
    '/projects',
    '/services',
    '/footer',
    '/blog',
    '/settings',
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

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
