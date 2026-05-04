import { NextRequest, NextResponse } from 'next/server';
import { attachSessionCookie, getSessionFromRequest } from '@/lib/auth-session';

const APP_PROTECTED_PREFIXES = ['/dashboard', '/pds', '/profile', '/admin'];
const API_PROTECTED_PREFIXES = ['/api/admin', '/api/profile', '/api/pds', '/api/uploadthing'];

function isProtectedPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/me')
  ) {
    return NextResponse.next();
  }

  const isProtectedAppRoute = isProtectedPath(pathname, APP_PROTECTED_PREFIXES);
  const isProtectedApiRoute = isProtectedPath(pathname, API_PROTECTED_PREFIXES);

  if (!isProtectedAppRoute && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    if (isProtectedApiRoute) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (session.role !== 'ADMIN') {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  const response = NextResponse.next();
  await attachSessionCookie(response, session);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
