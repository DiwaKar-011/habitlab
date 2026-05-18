/** @type {import('next').NextConfig} */
const nextConfig = {
  analytics: false,
  experimental: {
    instrumentationHook: false,
  },
  serverExternalPackages: ['firebase-admin'],
}

module.exports = nextConfig