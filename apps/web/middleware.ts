import { NextResponse, type NextRequest } from 'next/server';

const protectedPrefixes = [
  '/dashboard',
  '/briefs',
  '/moodboards',
  '/favourites',
  '/requests',
  '/projects',
  '/messages',
  '/notifications',
  '/account',
  '/safety',
  '/admin',
  '/verification',
  '/portfolios/manage',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guarded = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // A prefetched redirect is cached by the router and replayed after sign-in,
  // so prefetches get the page shell; the app shell still guards the page.
  const prefetch = request.headers.has('next-router-prefetch');

  if (!guarded || prefetch || request.cookies.has('inside.session')) {
    return NextResponse.next();
  }

  const login = new URL('/login', request.url);
  login.searchParams.set('next', pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/briefs/:path*',
    '/moodboards/:path*',
    '/favourites/:path*',
    '/requests/:path*',
    '/projects/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/account/:path*',
    '/safety/:path*',
    '/admin/:path*',
    '/verification/:path*',
    '/portfolios/manage/:path*',
  ],
};
