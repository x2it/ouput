import { cookies } from 'next/headers';
import { verifyToken } from './api/auth/_utils';
import HomeClient from './home-client';

// 强制动态渲染，每次请求都读取 cookie
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getWorks() {
  try {
    const baseUrl = process.env.COZE_SUPABASE_URL ? `http://localhost:${process.env.DEPLOY_RUN_PORT || 5000}` : '';
    const res = await fetch(`${baseUrl}/api/works`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getConfig() {
  try {
    const baseUrl = process.env.COZE_SUPABASE_URL ? `http://localhost:${process.env.DEPLOY_RUN_PORT || 5000}` : '';
    const res = await fetch(`${baseUrl}/api/config`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

async function getAuthFromCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    // 使用 HMAC 签名验证，而非明文比较
    return verifyToken(token?.value);
  } catch {
    return false;
  }
}

// 生成 JSON-LD 结构化数据（SEO / GEO 优化：供搜索引擎与 AI 引擎提取实体）
function buildJsonLd(
  siteName: string,
  siteSlogan: string,
  seoDescription: string,
  works: Array<{ id: number; title: string; description: string; link: string | null }>,
  baseUrl: string
): string {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      name: siteName,
      alternateName: siteSlogan,
      description: seoDescription,
      url: baseUrl,
      inLanguage: 'zh-CN',
    },
    {
      '@type': 'ProfilePage',
      '@id': `${baseUrl}/#profile`,
      name: siteName,
      description: seoDescription,
      url: baseUrl,
      inLanguage: 'zh-CN',
      isPartOf: { '@id': `${baseUrl}/#website` },
      mainEntity: {
        '@type': 'Person',
        '@id': `${baseUrl}/#person`,
        name: siteName,
        description: siteSlogan,
        knowsAbout: works.map((w) => w.title),
      },
    },
  ];

  if (works.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${baseUrl}/#works`,
      name: `${siteName} 作品集`,
      itemListElement: works.map((w, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: w.title,
        description: w.description,
        ...(w.link ? { url: w.link } : {}),
      })),
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c'
  );
}

export default async function HomePage() {
  const [initialWorks, initialConfig, initialAuth] = await Promise.all([
    getWorks(),
    getConfig(),
    getAuthFromCookies(),
  ]);

  // 公共域名（用于嵌入代码生成），强制 HTTPS
  const rawDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  const publicDomain = rawDomain
    ? `https://${rawDomain.replace(/^https?:\/\//, '')}`
    : '';

  // 构造 JSON-LD（配置缺失时使用默认值兜底；无公网域名时不注入）
  const siteName = initialConfig?.site_name || '7喵仓库';
  const siteSlogan = initialConfig?.site_slogan || '作品，即答案';
  const seoDescription =
    initialConfig?.seo_description || `${siteName} - ${siteSlogan}`;
  const jsonLd = publicDomain
    ? buildJsonLd(siteName, siteSlogan, seoDescription, initialWorks || [], publicDomain)
    : '';

  return (
    <>
      {/* 结构化数据：供 Google / Bing / ChatGPT / Perplexity 等引擎提取实体 */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <HomeClient
        initialWorks={initialWorks}
        initialConfig={initialConfig}
        initialAuth={initialAuth}
        publicDomain={publicDomain}
      />
    </>
  );
}
