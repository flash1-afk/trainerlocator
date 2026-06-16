/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Strip trailing slash if present, default to localhost
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
