/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // User-supplied image URLs (avatars, portfolio and moodboard images) can point
    // anywhere until file uploads exist, so any https host has to be allowed.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
