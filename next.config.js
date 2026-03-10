/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    're2',
    'metascraper',
    'metascraper-title',
    'metascraper-description',
    'metascraper-image',
    'cheerio',
  ],
}

module.exports = nextConfig
