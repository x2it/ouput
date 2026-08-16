import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '作品集嵌入',
  description: '嵌入式作品集展示',
  // 嵌入页是第三方网站 iframe 用，禁止被搜索引擎收录，避免重复内容
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-transparent">
      {children}
    </div>
  );
}
