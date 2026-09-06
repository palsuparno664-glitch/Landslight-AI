/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        // Safety-net proxy for any /api/v1/* path without a route handler.
        // Route handlers shadow this, but point it at BACKEND_URL so the
        // same config works in dev (localhost) and on Vercel (public URL).
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
