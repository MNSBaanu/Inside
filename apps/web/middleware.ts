import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/briefs(.*)',
  '/moodboards(.*)',
  '/favourites(.*)',
  '/requests(.*)',
  '/projects(.*)',
  '/schedule(.*)',
  '/messages(.*)',
  '/notifications(.*)',
  '/account(.*)',
  '/safety(.*)',
  '/admin(.*)',
  '/verification(.*)',
  '/portfolios/manage(.*)',
]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isProtected(request)) await auth.protect();
  },
  { signInUrl: '/login', signUpUrl: '/register' },
);

// Only signed-in areas run the middleware. Public pages skip it, so a first
// visit has no Clerk handshake redirects and the page comes from the CDN cache.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/briefs/:path*',
    '/moodboards/:path*',
    '/favourites/:path*',
    '/requests/:path*',
    '/projects/:path*',
    '/schedule/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/account/:path*',
    '/safety/:path*',
    '/admin/:path*',
    '/verification/:path*',
    '/portfolios/manage/:path*',
    '/(api|trpc)(.*)',
  ],
};
