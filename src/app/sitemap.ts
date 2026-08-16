import { MetadataRoute } from 'next';

// 强制动态生成，读取最新配置与作品
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 公开域名（无则返回空 sitemap，避免生成无效 URL）
  const rawDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  if (!rawDomain) return [];

  const baseUrl = `https://${rawDomain.replace(/^https?:\/\//, '')}`;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/embed`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
  ];
}
