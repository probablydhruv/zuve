/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    additionalSitemaps: [
      (process.env.SITE_URL || 'http://localhost:3000') + '/server-sitemap.xml',
    ],
  },
  exclude: ['/projects', '/canvas/*', '/auth/*'],
}


