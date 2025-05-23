/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['assets.seasonallysimple.com']
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Ensure these modules are only loaded client-side
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark html2canvas and jspdf as external for server-side builds
      // This prevents the server from trying to bundle them
      config.externals = [...config.externals, 'html2canvas', 'jspdf'];
    }
    return config;
  }
};

module.exports = nextConfig;