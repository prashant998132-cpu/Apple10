/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.nasa.gov' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: '**.pexels.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: '**.themealdb.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { canvas: false, fs: false, net: false, tls: false };
    if (!isServer) {
      config.resolve.fallback.crypto = false;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',  value: 'on' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(self), geolocation=(self), payment=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https: wss: http:",
              "font-src 'self' data: https:",
              "worker-src 'self' blob:",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type',            value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control',           value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed',  value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type',   value: 'application/manifest+json' },
          { key: 'Cache-Control',  value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
        ],
      },
      {
        source: '/api/health',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=60' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Clean PWA routes
      { source: '/chat', destination: '/' },
    ];
  },
};

module.exports = nextConfig;
