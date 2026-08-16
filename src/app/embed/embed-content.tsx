'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface Work {
  id: number;
  title: string;
  description: string;
  link: string | null;
  image: string | null;
  sort_order: number;
}

interface EmbedContentProps {
  initialWorks: Work[];
  initialSiteName: string;
  initialDescription: string;
}

// 主题配置 - colorful 使用与主页一致的10色渐变
const colorfulCards = [
  'from-slate-50 to-slate-100',
  'from-sky-50 to-sky-100',
  'from-emerald-50 to-emerald-100',
  'from-violet-50 to-violet-100',
  'from-amber-50 to-amber-100',
  'from-rose-50 to-rose-100',
  'from-teal-50 to-teal-100',
  'from-indigo-50 to-indigo-100',
  'from-orange-50 to-orange-100',
  'from-cyan-50 to-cyan-100',
];

const themes = {
  colorful: { bg: 'from-gray-50 via-white to-gray-50', card: colorfulCards, dark: false },
  neutral: { bg: 'from-gray-50 via-white to-gray-50', card: ['from-gray-100 to-gray-200', 'from-slate-100 to-slate-200', 'from-zinc-100 to-zinc-200', 'from-stone-100 to-stone-200', 'from-gray-100 to-slate-200', 'from-slate-100 to-zinc-200'], dark: false },
  blue: { bg: 'from-blue-50 via-white to-blue-50', card: ['from-blue-100 to-blue-200', 'from-sky-100 to-sky-200', 'from-indigo-100 to-indigo-200', 'from-cyan-100 to-cyan-200', 'from-blue-100 to-sky-200', 'from-sky-100 to-indigo-200'], dark: false },
  green: { bg: 'from-green-50 via-white to-green-50', card: ['from-green-100 to-green-200', 'from-emerald-100 to-emerald-200', 'from-teal-100 to-teal-200', 'from-lime-100 to-lime-200', 'from-green-100 to-emerald-200', 'from-emerald-100 to-teal-200'], dark: false },
  purple: { bg: 'from-purple-50 via-white to-purple-50', card: ['from-purple-100 to-purple-200', 'from-violet-100 to-violet-200', 'from-fuchsia-100 to-fuchsia-200', 'from-pink-100 to-pink-200', 'from-purple-100 to-violet-200', 'from-violet-100 to-fuchsia-200'], dark: false },
  warm: { bg: 'from-orange-50 via-white to-orange-50', card: ['from-orange-100 to-orange-200', 'from-amber-100 to-amber-200', 'from-yellow-100 to-yellow-200', 'from-red-100 to-red-200', 'from-orange-100 to-amber-200', 'from-amber-100 to-yellow-200'], dark: false },
  dark: { bg: 'from-gray-900 via-gray-800 to-gray-900', card: ['from-gray-700 to-gray-800', 'from-blue-900 to-blue-800', 'from-green-900 to-green-800', 'from-purple-900 to-purple-800', 'from-orange-900 to-orange-800', 'from-pink-900 to-pink-800'], dark: true },
  sunset: { bg: 'from-red-50 via-orange-50 to-yellow-50', card: ['from-red-100 to-red-200', 'from-orange-100 to-orange-200', 'from-yellow-100 to-yellow-200', 'from-pink-100 to-pink-200', 'from-rose-100 to-rose-200', 'from-red-100 to-orange-200'], dark: false },
  ocean: { bg: 'from-cyan-50 via-blue-50 to-teal-50', card: ['from-cyan-100 to-cyan-200', 'from-blue-100 to-blue-200', 'from-teal-100 to-teal-200', 'from-sky-100 to-sky-200', 'from-cyan-100 to-blue-200', 'from-blue-100 to-teal-200'], dark: false },
  aurora: { bg: 'from-violet-50 via-purple-50 to-fuchsia-50', card: ['from-violet-100 to-violet-200', 'from-purple-100 to-purple-200', 'from-fuchsia-100 to-fuchsia-200', 'from-pink-100 to-pink-200', 'from-violet-100 to-purple-200', 'from-purple-100 to-fuchsia-200'], dark: false },
  neon: { bg: 'from-pink-50 via-rose-50 to-fuchsia-50', card: ['from-pink-100 to-pink-200', 'from-rose-100 to-rose-200', 'from-fuchsia-100 to-fuchsia-200', 'from-pink-100 to-rose-200', 'from-fuchsia-100 to-pink-200', 'from-rose-100 to-fuchsia-200'], dark: false },
  mint: { bg: 'from-emerald-50 via-green-50 to-teal-50', card: ['from-emerald-100 to-emerald-200', 'from-green-100 to-green-200', 'from-teal-100 to-teal-200', 'from-emerald-100 to-green-200', 'from-green-100 to-teal-200', 'from-teal-100 to-emerald-200'], dark: false },
};

// 固定列数对应的 grid class（向后兼容 cols=1/2/3/4）
const colsGridClass: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

// auto 模式：完全响应式，跟随容器宽度自动适配
const autoGridClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4';

// 间距对应的静态 class（Tailwind JIT 无法识别动态拼接）
const gapClassMap: Record<string, string> = {
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '8': 'gap-8',
};

export default function EmbedContent({ initialWorks, initialSiteName, initialDescription }: EmbedContentProps) {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  // 解析 URL 参数
  const themeParam = (searchParams.get('theme') as keyof typeof themes) || 'colorful';
  const theme = themes[themeParam] || themes.colorful;
  const colsRaw = searchParams.get('cols') || 'auto';
  const colsNum = Number(colsRaw);
  const isAutoCols = colsRaw === 'auto' || ![1, 2, 3, 4].includes(colsNum);
  const cols = isAutoCols ? 0 : colsNum; // 0 = auto
  const showHeader = searchParams.get('header') !== 'false';
  const showFooter = searchParams.get('footer') !== 'false';
  const gapParam = searchParams.get('gap') || '6';
  const gap = ['2', '3', '4', '5', '6', '8'].includes(gapParam) ? gapParam : '6';
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 50) : 0; // 0 = 全部显示

  // 关键：使用 server-side 预取的初始数据，SSR 阶段就有内容
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [loading] = useState(false); // 初始为 false，因为已经有数据
  const [mounted, setMounted] = useState(false);

  const gridClass = useMemo(() => {
    if (isAutoCols) return autoGridClass;
    return colsGridClass[cols] || autoGridClass;
  }, [isAutoCols, cols]);

  const gapClass = useMemo(() => gapClassMap[gap] || 'gap-6', [gap]);

  // 通知父容器 iframe 实际高度（实现自动高度）
  const notifyHeight = useCallback(() => {
    if (!containerRef.current) return;
    const height = containerRef.current.scrollHeight;
    // postMessage 通知父页面
    window.parent.postMessage({ type: 'embed-height', height }, '*');
  }, []);

  useEffect(() => {
    setMounted(true);
    // 透明化 body 背景，避免第三方嵌入时底部灰色底色
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
  }, []);

  // 监听内容高度变化，通知父容器
  useEffect(() => {
    if (!mounted || loading || !containerRef.current) return;

    // 初始通知
    notifyHeight();

    // ResizeObserver 监听容器高度变化
    const observer = new ResizeObserver(() => {
      notifyHeight();
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [mounted, loading, works, notifyHeight]);

  // 监听 limit 变化，客户端重新获取数据（如果 SSR 数据不够）
  useEffect(() => {
    if (!mounted) return;
    if (limit > 0 && works.length > limit) {
      setWorks(works.slice(0, limit));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, limit]);

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-gradient-to-br ${theme.bg}`}
    >
      {/* Header */}
      {showHeader && (initialSiteName || initialDescription) && (
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          {initialSiteName && (
            <h1 className={`text-3xl font-bold ${theme.dark ? 'text-white' : 'text-gray-900'} mb-2`}>{initialSiteName}</h1>
          )}
          {initialDescription && (
            <p className={`text-base ${theme.dark ? 'text-gray-300' : 'text-gray-500'} max-w-2xl mx-auto`}>{initialDescription}</p>
          )}
        </div>
      )}

      {/* 作品网格 */}
      {works.length === 0 ? (
        <div className="text-center py-20">
          <p className={theme.dark ? 'text-gray-400' : 'text-gray-500'}>暂无作品</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className={`grid ${gridClass} ${gapClass}`}>
            {works.map((work, index) => {
              const cardColor = theme.card[index % theme.card.length];

              return (
                <a
                  key={work.id}
                  href={work.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block bg-gradient-to-br ${cardColor} backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-white/30`}
                >
                  {work.image && (
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
                      <Image
                        src={work.image}
                        alt={work.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className={`text-base font-semibold ${theme.dark ? 'text-white' : 'text-gray-900'} mb-1.5 line-clamp-1`}>
                      {work.title}
                    </h3>
                    {work.description && (
                      <p className={`text-sm ${theme.dark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2 leading-relaxed`}>
                        {work.description}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-sm ${theme.dark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
          >
            访问 {initialSiteName || '7喵仓库'}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
