import type { Metadata } from 'next';
import { getConfig } from '@/storage/database/local-store';
import './globals.css';

// 从本地文件获取配置来生成metadata
export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await getConfig();
    
    const siteName = config.site_name || '7喵仓库';
    const siteSlogan = config.site_slogan || '作品，即答案';
    const seoTitle = config.seo_title || `${siteName} - ${siteSlogan}`;
    const seoDescription = config.seo_description || `${siteName} - ${siteSlogan}`;
    const rawDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
    const baseUrl = rawDomain ? `https://${rawDomain.replace(/^https?:\/\//, '')}` : undefined;
    
    return {
      title: {
        default: seoTitle,
        template: `%s | ${siteName}`,
      },
      description: seoDescription,
      keywords: [
        siteName,
        '作品集',
        '个人网站',
      ],
      authors: [{ name: siteName }],
      generator: 'Coze Code',
      alternates: baseUrl ? { canonical: baseUrl } : undefined,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        siteName: siteName,
        locale: 'zh_CN',
        type: 'website',
        url: baseUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
      },
      robots: {
        index: true,
        follow: true,
      },
      icons: {
        icon: [
          { url: '/favicon.svg', type: 'image/svg+xml' },
          { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [
          { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
      },
    };
  } catch {
    // 如果获取失败（如表不存在），返回默认metadata
    console.warn('Failed to fetch SEO config, using defaults');
    const rawDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
    const baseUrl = rawDomain ? `https://${rawDomain.replace(/^https?:\/\//, '')}` : undefined;
    return {
      title: {
        default: '7喵仓库 - 作品，即答案',
        template: '%s | 7喵仓库',
      },
      description: '7喵仓库 - 作品，即答案',
      keywords: [
        '7喵仓库',
        '作品集',
        '个人网站',
      ],
      authors: [{ name: '7喵仓库' }],
      generator: 'Coze Code',
      alternates: baseUrl ? { canonical: baseUrl } : undefined,
      openGraph: {
        title: '7喵仓库 - 作品，即答案',
        description: '7喵仓库 - 作品，即答案',
        siteName: '7喵仓库',
        locale: 'zh_CN',
        type: 'website',
        url: baseUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: '7喵仓库 - 作品，即答案',
        description: '7喵仓库 - 作品，即答案',
      },
      robots: {
        index: true,
        follow: true,
      },
      icons: {
        icon: [
          { url: '/favicon.svg', type: 'image/svg+xml' },
          { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [
          { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
