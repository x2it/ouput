'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Config {
  site_name: string;
  site_slogan: string;
}

export default function NotFound() {
  const [config, setConfig] = useState<Config>({ site_name: '7喵仓库', site_slogan: '作品，即答案' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setConfig(json.data || { site_name: '7喵仓库', site_slogan: '作品，即答案' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 导航栏 - 站名居中，右上角放置操作按钮 */}
      <nav className="px-4 sm:px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-gray-100/50 relative">
        {/* 左侧：占位，保持平衡 */}
        <div className="hidden sm:block w-32"></div>
        
        {/* 中间：站名居中 */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-lg sm:text-xl font-medium text-gray-900">{config.site_name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{config.site_slogan}</p>
        </div>
        
        {/* 右上角：返回 */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <Link 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-300 touch-manipulation"
          >
            返回
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center">
          <div className="text-8xl font-light text-gray-200 mb-6">404</div>
          <p className="text-gray-400 mb-8">页面不存在</p>
          <Link 
            href="/" 
            className="inline-block px-8 py-3 bg-white/80 backdrop-blur-sm rounded-lg text-gray-900 hover:bg-white hover:shadow-md transition-all duration-300 shadow-sm border border-gray-100/50"
          >
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}
