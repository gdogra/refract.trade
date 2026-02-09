/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    IEX_API_KEY: process.env.IEX_API_KEY,
    POLYGON_API_KEY: process.env.POLYGON_API_KEY,
  },
}

module.exports = nextConfig