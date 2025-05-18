/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    fontLoaders: [
      {
        loader: '@next/font/google',
        options: { timeout: 10000 },
      },
    ],
  },
  // Removed exportPathMap as it is not supported with the "app" directory.
};

module.exports = nextConfig;