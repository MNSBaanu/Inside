const isDev = process.env.NODE_ENV !== 'production';
const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
).origin;
// The publishable key encodes the Clerk Frontend API host the browser talks to.
const clerkOrigin = `https://${Buffer.from(
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '').split('_')[2] ?? '',
  'base64',
)
  .toString()
  .replace(/\$$/, '')}`;

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://js.stripe.com ${clerkOrigin} https://cdn.protect.clerk.com https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // User images outside the optimizer allowlist are loaded directly.
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "worker-src 'self' blob:",
  `connect-src 'self' ${apiOrigin} ${apiOrigin.replace(/^http/, 'ws')} https://api.cloudinary.com https://api.stripe.com ${clerkOrigin} https://*.protect.clerk.com https://clerk-telemetry.com${isDev ? ' ws: wss:' : ''}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || (isDev ? '.next-dev' : '.next'),
  images: {
    // Only our own upload host and the stock-photo host go through the optimizer.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/designers', destination: '/explore?tab=designers', permanent: true },
      { source: '/portfolios', destination: '/explore', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
