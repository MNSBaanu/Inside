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

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
