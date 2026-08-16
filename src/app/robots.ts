import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  const baseUrl = rawDomain
    ? `https://${rawDomain.replace(/^https?:\/\//, '')}`
    : undefined;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/static/', '/login'],
      },
    ],
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
  };
}
