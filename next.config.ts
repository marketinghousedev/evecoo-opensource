import type { NextConfig } from 'next';

const prod = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  ...(prod
    ? { output: 'export' as const, trailingSlash: true }
    : {
        // dev only: the PHP API runs on :8080 (php -S); card/join are shell pages
        async rewrites() {
          return [
            { source: '/api/:path*', destination: 'http://127.0.0.1:8080/api/:path*' },
            { source: '/card/:id', destination: '/card' },
            { source: '/join/:id', destination: '/join' },
          ];
        },
      }),
};

export default nextConfig;
