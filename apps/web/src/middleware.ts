import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GATE_COOKIE, parseGateCookie } from '@/lib/auth/session';
import { canAccessArea, homePathForGate, isPublicPath } from '@/lib/auth/roles';

function areaFromPath(pathname: string): 'client' | 'designer' | 'admin' | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/designer')) return 'designer';
  if (pathname.startsWith('/client')) return 'client';
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const gate = parseGateCookie(request.cookies.get(GATE_COOKIE)?.value);
  const area = areaFromPath(pathname);
  const needsAuth = Boolean(area) || pathname.startsWith('/profile');

  if (needsAuth) {
    if (!gate) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    if (area && !canAccessArea(gate, area)) {
      return NextResponse.redirect(new URL(homePathForGate(gate), request.url));
    }
    return NextResponse.next();
  }

  if (gate && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL(homePathForGate(gate), request.url));
  }

  if (!isPublicPath(pathname) && !area) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
