import { Suspense } from 'react';
import EmbedContent from './embed-content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 按 sort_order 排序（-1 在最前 = 置顶），再按 id 升序
function sortWorks<T extends { sort_order?: number; id: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const sa = a.sort_order ?? 0;
    const sb = b.sort_order ?? 0;
    if (sa !== sb) return sa - sb; // -1 优先
    return a.id - b.id;
  });
}

interface EmbedPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  // 服务端预取数据：这样嵌入第三方网站时（即便禁 JS）也能看到完整内容
  const params = await searchParams;
  const limitParam = typeof params.limit === 'string' ? params.limit : undefined;
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 50) : 0;

  let works: Array<{
    id: number;
    title: string;
    description: string;
    link: string | null;
    image: string | null;
    sort_order: number;
  }> = [];
  let siteName = '7喵仓库';
  let description = '';

  // 用 dynamic import 避免顶层 fs/child_process 解析冲突
  type RawWork = { id: number; title: string; description: string; link: string | null; image: string | null; sort_order?: number };
  try {
    const mod = await import('@/storage/database/local-store');
    const all = await mod.getAllWorks();
    works = sortWorks(all as RawWork[]).map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      link: w.link,
      image: w.image,
      sort_order: w.sort_order ?? 0,
    }));

    // 读取 site_name 和 seo_description
    const config = await mod.getConfig().catch(() => null);
    if (config) {
      const c = config as unknown as Record<string, unknown>;
      if (typeof c.site_name === 'string' && c.site_name) siteName = c.site_name;
      if (typeof c.seo_description === 'string' && c.seo_description) description = c.seo_description;
    }
  } catch (err) {
    console.error('[embed/page] failed to load data:', err);
    works = [];
  }

  // 应用 limit
  const displayWorks = limit > 0 ? works.slice(0, limit) : works;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <EmbedContent
        initialWorks={displayWorks}
        initialSiteName={siteName}
        initialDescription={description}
      />
    </Suspense>
  );
}
