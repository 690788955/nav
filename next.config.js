/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
      're2',
      'metascraper',
      'metascraper-title',
      'metascraper-description',
      'metascraper-image',
      'cheerio',
    ],
  },
}

module.exports = nextConfig
