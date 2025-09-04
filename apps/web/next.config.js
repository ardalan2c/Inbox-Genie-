/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: [process.env.APP_BASE_URL || 'http://localhost:3001'] }
  }
}

module.exports = nextConfig
