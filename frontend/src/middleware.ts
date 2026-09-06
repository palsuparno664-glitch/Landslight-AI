import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';

/** Officer-only destinations — citizens are redirected away before they load. */
const OFFICER_ONLY_PATHS = ['/dispatch', '/analytics'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('ls_session')?.value;

  // Already-authed visitors skip the login page.
  if (pathname === '/login') {
    const session = await verifySessionToken(token);
    if (session) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  const session = await verifySessionToken(token);
  if (!session) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role === 'citizen' && OFFICER_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico).*)'],
};