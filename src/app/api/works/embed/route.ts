import { NextResponse } from 'next/server';
import { getConfig, getAllWorks } from '@/storage/database/local-store';

// 处理图片路径，将相对路径转换为绝对路径
function normalizeImagePath(imagePath: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  return `/${imagePath}`;
}

export async function GET() {
  try {
    const config = await getConfig();
    const works = await getAllWorks();

    const normalizedWorks = works.map(work => ({
      ...work,
      image: normalizeImagePath(work.image),
    }));

    return NextResponse.json({
      siteName: config.site_name || '7喵仓库',
      description: config.site_slogan || '',
      works: normalizedWorks,
    });
  } catch (error) {
    console.error('Error fetching embed data:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
