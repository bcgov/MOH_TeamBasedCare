/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  experimental: {
    scrollRestoration: true,
  },
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};
