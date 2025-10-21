/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't use output: 'export' - mobile app will use live server
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
